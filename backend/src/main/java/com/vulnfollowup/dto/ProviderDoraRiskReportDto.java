package com.vulnfollowup.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resumen de riesgo DORA de un proveedor TIC obtenido mediante consulta SQL agregada en JDBC.
 *
 * @param providerId                     identificador del proveedor ({@code ict_providers.id})
 * @param providerCode                   código oficial del proveedor (ej. {@code PROV-005})
 * @param providerName                   razón social del proveedor (ej. {@code HostingSur S.L.})
 * @param criticality                    criticidad del proveedor ({@code LOW}, {@code MEDIUM}, {@code HIGH}, {@code CRITICAL})
 * @param criticalThirdParty             indicador DORA de proveedor tercero crítico ({@code is_critical_third_party})
 * @param reviewDate                     fecha de próxima revisión contractual (ej. {@code 2026-03-15})
 * @param totalAssets                    número total de activos tecnológicos vinculados al proveedor
 * @param openOrPendingHighCriticalVulns vulnerabilidades en {@code ABIERTA} o {@code PENDIENTE DE REMEDIACIÓN}
 *                                       con severidad {@code HIGH} o {@code CRITICAL} en activos del proveedor
 * @param maxCvssScore                   nota CVSS máxima entre las vulnerabilidades activas del proveedor
 */
public record ProviderDoraRiskReportDto(
        Integer providerId,
        String providerCode,
        String providerName,
        String criticality,
        boolean criticalThirdParty,
        LocalDate reviewDate,
        int totalAssets,
        int openOrPendingHighCriticalVulns,
        BigDecimal maxCvssScore
) {
}
