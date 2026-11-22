package com.vulnfollowup.controller;

import com.vulnfollowup.dto.ApiDtos.*;
import com.vulnfollowup.dto.ProviderDoraRiskReportDto;
import com.vulnfollowup.model.*;
import com.vulnfollowup.model.enums.VulnerabilityStatus;
import com.vulnfollowup.repository.*;
import com.vulnfollowup.service.VulnerabilityService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/providers")
public class ProviderController {

    private final TicProviderRepository provRepo;
    private final ProviderRiskJdbcDao provDao;
    private final AssetRepository assetRepo;
    private final VulnerabilityService vulnService;

    public ProviderController(
            TicProviderRepository provRepo,
            ProviderRiskJdbcDao provDao,
            AssetRepository assetRepo,
            VulnerabilityService vulnService
    ) {
        this.provRepo = provRepo;
        this.provDao = provDao;
        this.assetRepo = assetRepo;
        this.vulnService = vulnService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<IctProviderDto>> listProviders(
            @RequestParam(required = false) String criticality,
            @RequestParam(required = false) String contractStatus,
            @RequestParam(required = false) Boolean atRiskOnly
    ) {
        Map<Integer, ProviderDoraRiskReportDto> riskMap = provDao.findAllProviderRiskReports().stream()
                .collect(Collectors.toMap(ProviderDoraRiskReportDto::providerId, r -> r));

        List<IctProviderDto> list = provRepo.findAll().stream()
                .map(p -> toProviderDto(p, riskMap.get(p.getId())))
                .filter(dto -> criticality == null || criticality.isBlank()
                        || dto.criticality().getDbValue().equalsIgnoreCase(criticality.trim()))
                .filter(dto -> contractStatus == null || contractStatus.isBlank()
                        || dto.contractStatus().equalsIgnoreCase(contractStatus.trim()))
                .filter(dto -> !Boolean.TRUE.equals(atRiskOnly) || "AT_RISK".equals(dto.doraRiskStatus()))
                .toList();

        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<IctProviderDto> createProvider(@Valid @RequestBody IctProviderUpsertRequestDto body) {
        TicProvider entity = new TicProvider();
        applyFields(entity, body);
        TicProvider saved = provRepo.saveAndFlush(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(toProviderDto(saved, null));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<IctProviderDto> updateProvider(
            @PathVariable Integer id,
            @Valid @RequestBody IctProviderUpsertRequestDto body
    ) {
        TicProvider entity = provRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el proveedor TIC con id: " + id));
        applyFields(entity, body);
        TicProvider saved = provRepo.saveAndFlush(entity);
        ProviderDoraRiskReportDto risk = provDao.findProviderRiskReportById(id).orElse(null);
        return ResponseEntity.ok(toProviderDto(saved, risk));
    }

    @GetMapping("/{id}/report")
    @Transactional(readOnly = true)
    public ResponseEntity<ProviderDoraReportDto> getDoraReport(@PathVariable Integer id) {
        TicProvider provider = provRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el proveedor TIC con id: " + id));
        ProviderDoraRiskReportDto risk = provDao.findProviderRiskReportById(id).orElse(null);
        IctProviderDto providerDto = toProviderDto(provider, risk);

        List<AssetDto> managedAssets = assetRepo.findAll().stream()
                .filter(a -> a.getProvider() != null && Objects.equals(a.getProvider().getId(), id))
                .map(VulnerabilityController::toAssetDto)
                .toList();

        List<VulnerabilitySummaryDto> pendingVulns = vulnService.findAllWithDetails().stream()
                .filter(v -> v.getStatus() == VulnerabilityStatus.ABIERTA
                        || v.getStatus() == VulnerabilityStatus.PENDIENTE_DE_REMEDIACION)
                .filter(v -> v.getAssetLinks().stream().anyMatch(link -> link.getAsset() != null
                        && link.getAsset().getProvider() != null
                        && Objects.equals(link.getAsset().getProvider().getId(), id)))
                .map(VulnerabilityController::toSummaryDto)
                .toList();

        String doraStatus = providerDto.doraRiskStatus();
        String justification = "AT_RISK".equals(doraStatus)
                ? "Proveedor " + provider.getName() + " con revisión " + provider.getReviewDate()
                        + " presenta " + providerDto.activeCriticalHighVulnsCount()
                        + " vulnerabilidad(es) HIGH/CRITICAL activa(s) en activos gestionados."
                : "Proveedor " + provider.getName() + " conforme con DORA Cap. V sin vulnerabilidades HIGH/CRITICAL abiertas.";

        return ResponseEntity.ok(new ProviderDoraReportDto(
                providerDto,
                OffsetDateTime.now(ZoneOffset.UTC),
                doraStatus,
                justification,
                managedAssets,
                pendingVulns
        ));
    }

    public static IctProviderDto toProviderDto(TicProvider p, ProviderDoraRiskReportDto risk) {
        int assetsCount = risk != null ? risk.totalAssets() : p.getAssets().size();
        int activeCriticalHigh = risk != null ? risk.openOrPendingHighCriticalVulns() : 0;
        String doraStatus = activeCriticalHigh > 0 ? "AT_RISK" : "COMPLIANT";
        return new IctProviderDto(
                p.getId(),
                p.getProviderCode(),
                p.getName(),
                p.getProvidedService(),
                p.getCriticality(),
                p.getContractReference(),
                p.getContractStatus(),
                p.getReviewDate(),
                p.getContactEmail(),
                p.getCountryCode(),
                p.getSlaAvailabilityPct(),
                assetsCount,
                activeCriticalHigh,
                doraStatus
        );
    }

    private static void applyFields(TicProvider target, IctProviderUpsertRequestDto src) {
        target.setProviderCode(src.providerCode().trim());
        target.setName(src.name().trim());
        target.setProvidedService(src.providedService().trim());
        target.setCriticality(src.criticality());
        target.setContractReference(src.contractReference().trim());
        target.setContractStatus(src.contractStatus().trim());
        target.setReviewDate(src.reviewDate());
        target.setContactEmail(src.contactEmail().trim());
        target.setCountryCode(src.countryCode().trim());
        target.setSlaAvailabilityPct(src.slaAvailabilityPct());
    }
}
