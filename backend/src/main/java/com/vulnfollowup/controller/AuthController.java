package com.vulnfollowup.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vulnfollowup.dto.ApiDtos.LoginResponseDto;
import com.vulnfollowup.dto.ApiDtos.UserSummaryDto;
import com.vulnfollowup.dto.AuthResponse;
import com.vulnfollowup.dto.LoginRequest;
import com.vulnfollowup.model.User;
import com.vulnfollowup.repository.UserRepository;
import com.vulnfollowup.security.JwtTokenService;
import com.vulnfollowup.service.AuthService;

import jakarta.validation.Valid;

/**
 * Controlador REST de autenticación JWT y comprobación de estado de la API.
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;

    public AuthController(
            AuthService authService,
            UserRepository userRepository,
            JwtTokenService jwtTokenService
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse auth = authService.login(request.getUsername(), request.getPassword());

        UserSummaryDto userSummary = userRepository.findByUsername(auth.getUsername())
                .map(AuthController::toUserSummary)
                .orElseGet(() -> new UserSummaryDto(
                        auth.getUserId(),
                        auth.getUsername(),
                        auth.getUsername() + "@vulnfollowup.eu",
                        auth.getUsername(),
                        auth.getRole()
                ));

        String accessToken = jwtTokenService.generateToken(
                auth.getUserId(),
                auth.getUsername(),
                auth.getRole()
        );

        LoginResponseDto response = new LoginResponseDto(
                accessToken,
                "Bearer",
                jwtTokenService.getExpirationSeconds(),
                userSummary,
                auth.getUserId(),
                auth.getUsername(),
                auth.getRole(),
                auth.isAuthenticated()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "vulnfollowup-backend"));
    }

    private static UserSummaryDto toUserSummary(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }
}
