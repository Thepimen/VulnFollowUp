package com.vulnfollowup.model.enums;

/**
 * Criticidad del proveedor TIC según el reglamento DORA (módulo SGE).
 * Los nombres coinciden directamente con el enum provider_criticality de la base de datos.
 */
public enum ProviderCriticality {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
