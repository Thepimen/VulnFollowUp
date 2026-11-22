package com.vulnfollowup.controller;

import com.vulnfollowup.dto.ApiDtos.VulnerabilitySummaryDto;
import com.vulnfollowup.model.Vulnerability;
import com.vulnfollowup.model.enums.*;
import com.vulnfollowup.service.*;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Controlador REST para la exportacion de informes ejecutivos CSV y HTML mediante ProcessBuilder (PSP).
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final VulnerabilityService vulnService;
    private final PspConcurrencyAndProcessService pspService;

    public ReportController(
            VulnerabilityService vulnService,
            PspConcurrencyAndProcessService pspService
    ) {
        this.vulnService = vulnService;
        this.pspService = pspService;
    }

    @GetMapping("/export")
    @Transactional(readOnly = true)
    public ResponseEntity<String> exportReport(
            @RequestParam(defaultValue = "CSV") String format,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer providerId
    ) {
        CvssSeverity sevFilter = (severity != null && !severity.isBlank())
                ? CvssSeverity.fromDbValue(severity.trim())
                : null;
        VulnerabilityStatus stFilter = parseStatusFilter(status);

        List<VulnerabilitySummaryDto> items = vulnService.findAllWithDetails().stream()
                .filter(v -> sevFilter == null || v.getSeverity() == sevFilter)
                .filter(v -> stFilter == null || v.getStatus() == stFilter)
                .filter(v -> providerId == null || v.getAssetLinks().stream().anyMatch(link ->
                        link.getAsset() != null
                                && link.getAsset().getProvider() != null
                                && Objects.equals(link.getAsset().getProvider().getId(), providerId)))
                .map(VulnerabilityController::toSummaryDto)
                .toList();

        String reportContent = pspService.generateReportViaOsProcess(format, items);
        boolean isHtml = "HTML".equalsIgnoreCase(format.trim());
        MediaType contentType = isHtml
                ? new MediaType("text", "html", StandardCharsets.UTF_8)
                : new MediaType("text", "csv", StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(contentType)
                .body(reportContent);
    }

    private static VulnerabilityStatus parseStatusFilter(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if ("PENDIENTE_DE_REMEDIACION".equals(trimmed)) {
            return VulnerabilityStatus.PENDIENTE_DE_REMEDIACION;
        }
        return VulnerabilityStatus.fromDbValue(trimmed);
    }
}
