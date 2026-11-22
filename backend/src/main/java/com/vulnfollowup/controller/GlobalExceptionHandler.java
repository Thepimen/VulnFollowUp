package com.vulnfollowup.controller;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.vulnfollowup.dto.ApiDtos.ApiErrorResponseDto;
import com.vulnfollowup.dto.ApiDtos.FieldIssueDto;
import com.vulnfollowup.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Manejador global de excepciones de la API REST que traduce las excepciones de negocio,
 * validación CVSS, concurrencia optimista y seguridad RBAC al contrato de error JSON estándar.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponseDto> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Solicitud inválida";

        if (AuthService.INVALID_CREDENTIALS.equals(message)) {
            return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message, request, List.of());
        }
        if (message.startsWith("No se encontró") || message.startsWith("No existe el proveedor")
                || message.startsWith("No existe el activo")) {
            return buildResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message, request, List.of());
        }
        if (message.startsWith("Ya existe")) {
            return buildResponse(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message, request, List.of());
        }
        if (message.contains("Incoherencia CVSS")
                || message.contains("Puntuación CVSS")
                || message.contains("evaluación CVSS")) {
            return buildResponse(HttpStatus.BAD_REQUEST, "CVSS_COHERENCE_VIOLATION", message, request, List.of());
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request, List.of());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponseDto> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request
    ) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Estado inválido";
        if (message.contains("Transición de estado no permitida")) {
            return buildResponse(HttpStatus.CONFLICT, "INVALID_STATE_TRANSITION", message, request, List.of());
        }
        return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, request, List.of());
    }

    @ExceptionHandler({SecurityException.class, AccessDeniedException.class})
    public ResponseEntity<ApiErrorResponseDto> handleForbidden(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Acceso denegado";
        return buildResponse(HttpStatus.FORBIDDEN, "FORBIDDEN_ROLE", message, request, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponseDto> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<FieldIssueDto> details = ex.getBindingResult().getFieldErrors().stream()
                .map(GlobalExceptionHandler::toFieldIssue)
                .toList();
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "La validación de los parámetros de entrada ha fallado",
                request,
                details
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponseDto> handleUnreadableBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                "Cuerpo JSON malformado o tipos de datos incompatibles",
                request,
                List.of()
        );
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponseDto> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex,
            HttpServletRequest request
    ) {
        return buildResponse(
                HttpStatus.CONFLICT,
                "DUPLICATE_RESOURCE",
                "Conflicto de concurrencia optimista: el registro fue modificado por otro usuario",
                request,
                List.of()
        );
    }

    private static FieldIssueDto toFieldIssue(FieldError error) {
        return new FieldIssueDto(
                error.getField(),
                error.getDefaultMessage() != null ? error.getDefaultMessage() : "Valor inválido"
        );
    }

    private static ResponseEntity<ApiErrorResponseDto> buildResponse(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request,
            List<FieldIssueDto> details
    ) {
        ApiErrorResponseDto body = new ApiErrorResponseDto(
                OffsetDateTime.now(ZoneOffset.UTC),
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI(),
                details
        );
        return ResponseEntity.status(status).body(body);
    }
}
