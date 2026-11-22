package com.vulnfollowup.controller;

import com.vulnfollowup.dto.ApiDtos.*;
import com.vulnfollowup.dto.ProviderDoraRiskReportDto;
import com.vulnfollowup.model.*;
import com.vulnfollowup.model.enums.*;
import com.vulnfollowup.repository.*;
import com.vulnfollowup.service.VulnerabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final VulnerabilityService vulnService;
    private final TicProviderRepository provRepo;
    private final ProviderRiskJdbcDao provDao;

    public DashboardController(
            VulnerabilityService vulnService,
            TicProviderRepository provRepo,
            ProviderRiskJdbcDao provDao
    ) {
        this.vulnService = vulnService;
        this.provRepo = provRepo;
        this.provDao = provDao;
    }

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<DashboardSummaryResponseDto> getSummary() {
        List<Vulnerability> vulns = vulnService.findAllWithDetails();

        Map<String, Long> bySeverity = new LinkedHashMap<>();
        for (CvssSeverity sev : CvssSeverity.values()) {
            bySeverity.put(sev.getDbValue(), 0L);
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (VulnerabilityStatus st : VulnerabilityStatus.values()) {
            byStatus.put(st.getDbValue(), 0L);
        }

        long openAndPending = 0L;
        long criticalOpen = 0L;

        for (Vulnerability v : vulns) {
            if (v.getSeverity() != null) {
                bySeverity.merge(v.getSeverity().getDbValue(), 1L, Long::sum);
            }
            if (v.getStatus() != null) {
                byStatus.merge(v.getStatus().getDbValue(), 1L, Long::sum);
                boolean active = v.getStatus() == VulnerabilityStatus.ABIERTA
                        || v.getStatus() == VulnerabilityStatus.PENDIENTE_DE_REMEDIACION;
                if (active) {
                    openAndPending++;
                    if (v.getSeverity() == CvssSeverity.CRITICAL) {
                        criticalOpen++;
                    }
                }
            }
        }

        Map<Integer, ProviderDoraRiskReportDto> riskByProvId = provDao.findAllProviderRiskReports().stream()
                .collect(Collectors.toMap(ProviderDoraRiskReportDto::providerId, r -> r));

        List<IctProviderDto> atRisk = provRepo.findAll().stream()
                .map(p -> ProviderController.toProviderDto(p, riskByProvId.get(p.getId())))
                .filter(dto -> "AT_RISK".equals(dto.doraRiskStatus()))
                .toList();

        return ResponseEntity.ok(new DashboardSummaryResponseDto(
                vulns.size(),
                openAndPending,
                criticalOpen,
                atRisk.size(),
                bySeverity,
                byStatus,
                atRisk
        ));
    }
}
