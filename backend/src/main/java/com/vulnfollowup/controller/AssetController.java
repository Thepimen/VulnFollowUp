package com.vulnfollowup.controller;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vulnfollowup.dto.ApiDtos.AssetCreateRequestDto;
import com.vulnfollowup.dto.ApiDtos.AssetDto;
import com.vulnfollowup.dto.ApiDtos.PaginatedResponseDto;
import com.vulnfollowup.model.Asset;
import com.vulnfollowup.model.TicProvider;
import com.vulnfollowup.model.enums.ProviderCriticality;
import com.vulnfollowup.repository.AssetRepository;
import com.vulnfollowup.repository.TicProviderRepository;

import jakarta.validation.Valid;

/**
 * Controlador REST para el inventario de activos tecnológicos vinculados a proveedores TIC.
 */
@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetRepository assetRepository;
    private final TicProviderRepository ticProviderRepository;

    public AssetController(
            AssetRepository assetRepository,
            TicProviderRepository ticProviderRepository
    ) {
        this.assetRepository = assetRepository;
        this.ticProviderRepository = ticProviderRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<PaginatedResponseDto<AssetDto>> listAssets(
            @RequestParam(required = false) Integer providerId,
            @RequestParam(required = false) String criticality,
            @RequestParam(required = false) String environment,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("El parámetro page no puede ser negativo");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("El parámetro size debe estar entre 1 y 100");
        }

        ProviderCriticality criticalityFilter = (criticality != null && !criticality.isBlank())
                ? ProviderCriticality.fromDbValue(criticality.trim())
                : null;
        String envFilter = (environment != null && !environment.isBlank()) ? environment.trim() : null;
        String searchTerm = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;

        List<AssetDto> filtered = assetRepository.findAll().stream()
                .filter(a -> providerId == null
                        || (a.getProvider() != null && Objects.equals(a.getProvider().getId(), providerId)))
                .filter(a -> criticalityFilter == null || a.getCriticality() == criticalityFilter)
                .filter(a -> envFilter == null || envFilter.equals(a.getEnvironment()))
                .filter(a -> searchTerm == null
                        || (a.getAssetCode() != null && a.getAssetCode().toLowerCase().contains(searchTerm))
                        || (a.getName() != null && a.getName().toLowerCase().contains(searchTerm)))
                .sorted(Comparator.comparing(Asset::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(VulnerabilityController::toAssetDto)
                .toList();

        long totalElements = filtered.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filtered.size());
        int toIndex = Math.min(fromIndex + size, filtered.size());
        boolean last = totalPages == 0 || page + 1 >= totalPages;

        return ResponseEntity.ok(new PaginatedResponseDto<>(
                filtered.subList(fromIndex, toIndex), page, size, totalElements, totalPages, last));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<AssetDto> createAsset(@Valid @RequestBody AssetCreateRequestDto request) {
        TicProvider provider = ticProviderRepository.findById(request.providerId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el proveedor TIC con id: " + request.providerId()));

        Asset asset = new Asset(
                request.assetCode().trim(),
                request.name().trim(),
                request.assetType().trim(),
                request.criticality(),
                request.ownerDepartment().trim(),
                provider
        );
        asset.setEnvironment(request.environment().trim());
        asset.setIpAddress(request.ipAddress());
        asset.setOperatingSystem(request.operatingSystem());

        Asset saved = assetRepository.saveAndFlush(asset);
        return ResponseEntity.status(HttpStatus.CREATED).body(VulnerabilityController.toAssetDto(saved));
    }
}
