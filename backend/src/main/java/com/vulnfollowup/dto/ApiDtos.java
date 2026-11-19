package com.vulnfollowup.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;
import com.vulnfollowup.model.enums.ProviderCriticality;
import com.vulnfollowup.model.enums.UserRole;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Contratos DTO de petición y respuesta HTTP de la API REST de VulnFollowUp,
 * alineados con {@code docs/api/openapi.yaml} y {@code desktop-client/src/types/api.ts}.
 */
public final class ApiDtos {

    private ApiDtos() {
    }

    public record FieldIssueDto(String field, String issue) {
    }

    public record ApiErrorResponseDto(
            OffsetDateTime timestamp,
            int status,
            String error,
            String code,
            String message,
            String path,
            List<FieldIssueDto> details
    ) {
    }

    public record UserSummaryDto(
            Integer id,
            String username,
            String email,
            String fullName,
            UserRole role
    ) {
    }

    public record LoginResponseDto(
            String accessToken,
            String tokenType,
            long expiresInSeconds,
            UserSummaryDto user,
            Integer userId,
            String username,
            UserRole role,
            boolean authenticated
    ) {
    }

    public record PaginatedResponseDto<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean last
    ) {
    }

    public record AssetDto(
            Integer id,
            String assetCode,
            String name,
            String assetType,
            ProviderCriticality criticality,
            String environment,
            String ownerDepartment,
            String ipAddress,
            String operatingSystem,
            String status,
            Integer providerId,
            String providerName,
            long openVulnerabilitiesCount
    ) {
    }

    public record AssetCreateRequestDto(
            @NotBlank @Size(min = 3, max = 40) @Pattern(regexp = "^[A-Z0-9-]+$") String assetCode,
            @NotBlank @Size(min = 2, max = 120) String name,
            @NotBlank @Size(max = 50) String assetType,
            @NotNull ProviderCriticality criticality,
            @NotBlank @Size(max = 30) String environment,
            @NotBlank @Size(min = 2, max = 100) String ownerDepartment,
            @Size(max = 45) String ipAddress,
            @Size(max = 80) String operatingSystem,
            @NotNull Integer providerId
    ) {
    }

    public record VulnerabilitySummaryDto(
            Integer id,
            String internalCode,
            String cveId,
            String title,
            String status,
            String cvssVersion,
            String cvssVector,
            BigDecimal cvssScore,
            CvssSeverity severity,
            Integer assignedTo,
            String assignedUsername,
            LocalDate discoveredAt,
            LocalDate targetRemediationDate,
            int affectedAssetsCount,
            String primaryProviderName
    ) {
    }

    public record CvssAssessmentDto(
            Integer id,
            Integer vulnerabilityId,
            Integer assessedBy,
            String assessedByUsername,
            String cvssVersion,
            String cvssVector,
            BigDecimal cvssScore,
            CvssSeverity severity,
            boolean isCurrent,
            OffsetDateTime assessedAt
    ) {
    }

    public record RemediationCommentDto(
            Integer id,
            Integer vulnerabilityId,
            Integer userId,
            String username,
            String commentText,
            String evidenceUrl,
            OffsetDateTime createdAt
    ) {
    }

    public record AuditLogDto(
            Integer id,
            Integer vulnerabilityId,
            Integer userId,
            String username,
            String actionType,
            String previousStatus,
            String newStatus,
            String justification,
            OffsetDateTime createdAt
    ) {
    }

    public record VulnerabilityDetailDto(
            Integer id,
            String internalCode,
            String cveId,
            String title,
            String description,
            String status,
            String cvssVersion,
            String cvssVector,
            BigDecimal cvssScore,
            CvssSeverity severity,
            String remediationPlan,
            Integer assignedTo,
            String assignedUsername,
            LocalDate discoveredAt,
            LocalDate targetRemediationDate,
            OffsetDateTime resolvedAt,
            int affectedAssetsCount,
            String primaryProviderName,
            List<AssetDto> affectedAssets,
            List<CvssAssessmentDto> assessmentsHistory,
            List<RemediationCommentDto> comments,
            List<AuditLogDto> auditTrail
    ) {
    }

    public record VulnerabilityCreateRequestDto(
            @NotBlank @Size(max = 20) String internalCode,
            @Size(max = 30) String cveId,
            @NotBlank @Size(min = 5, max = 200) String title,
            @NotBlank @Size(min = 10, max = 5000) String description,
            @NotBlank String cvssVersion,
            @NotBlank @Size(max = 180) String cvssVector,
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal cvssScore,
            @NotNull CvssSeverity severity,
            @Size(max = 3000) String remediationPlan,
            Integer assignedTo,
            LocalDate discoveredAt,
            LocalDate targetRemediationDate,
            @NotEmpty List<Integer> affectedAssetIds
    ) {
    }

    public record StatusTransitionRequestDto(
            @NotBlank String newStatus,
            @NotBlank @Size(min = 10, max = 2000) String justification,
            @Size(max = 2000) String commentText,
            @Size(max = 255) String evidenceUrl
    ) {
    }

    public record CvssAssessmentCreateRequestDto(
            @NotBlank String cvssVersion,
            @NotBlank @Size(max = 180) String cvssVector,
            @NotNull @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal cvssScore,
            @NotNull CvssSeverity severity,
            String justification
    ) {
    }

    public record BatchImportRequestDto(
            @NotBlank @Size(max = 120) String sourceFileName,
            @NotEmpty List<VulnerabilityCreateRequestDto> items
    ) {
    }

    public record BatchImportResultDto(
            String jobId,
            String status,
            int totalSubmitted,
            int insertedCount,
            boolean rolledBack,
            int workerThreadsUsed,
            long executionTimeMs,
            List<FieldIssueDto> errors
    ) {
    }

    public record IctProviderDto(
            Integer id,
            String providerCode,
            String name,
            String providedService,
            ProviderCriticality criticality,
            String contractReference,
            String contractStatus,
            LocalDate reviewDate,
            String contactEmail,
            String countryCode,
            BigDecimal slaAvailabilityPct,
            int managedAssetsCount,
            int activeCriticalHighVulnsCount,
            String doraRiskStatus
    ) {
    }

    public record IctProviderUpsertRequestDto(
            @NotBlank @Pattern(regexp = "^PROV-[0-9]{3,}$") String providerCode,
            @NotBlank @Size(min = 2, max = 120) String name,
            @NotBlank @Size(min = 5, max = 150) String providedService,
            @NotNull ProviderCriticality criticality,
            @NotBlank @Size(max = 100) String contractReference,
            @NotBlank String contractStatus,
            @NotNull LocalDate reviewDate,
            @NotBlank @Email @Size(max = 120) String contactEmail,
            @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
            @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal slaAvailabilityPct
    ) {
    }

    public record ProviderDoraReportDto(
            IctProviderDto provider,
            OffsetDateTime generatedAt,
            String doraRiskStatus,
            String riskJustification,
            List<AssetDto> managedAssets,
            List<VulnerabilitySummaryDto> pendingVulnerabilities
    ) {
    }

    public record DashboardSummaryResponseDto(
            long totalVulnerabilities,
            long openAndPendingCount,
            long criticalOpenCount,
            long providersAtRiskCount,
            Map<String, Long> bySeverity,
            Map<String, Long> byStatus,
            List<IctProviderDto> providersAtRisk
    ) {
    }

    public static CvssVersion parseCvssVersion(String rawVersion) {
        if (rawVersion == null || rawVersion.isBlank()) {
            throw new IllegalArgumentException("El campo cvss_version de la evaluación CVSS es obligatorio");
        }
        String trimmed = rawVersion.trim();
        if ("V3_1".equals(trimmed)) {
            return CvssVersion.V3_1;
        }
        if ("V4_0".equals(trimmed)) {
            return CvssVersion.V4_0;
        }
        return CvssVersion.fromDbValue(trimmed);
    }
}
