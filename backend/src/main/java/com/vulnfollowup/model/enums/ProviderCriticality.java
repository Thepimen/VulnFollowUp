package com.vulnfollowup.model.enums;

/**
 * Nivel de criticidad según el reglamento DORA.
 *
 * <p>Se usa tanto para los proveedores TIC ({@code ict_providers.criticality}) como para
 * los activos ({@code assets.criticality}). El valor de BD coincide con el nombre de la
 * constante y es el texto exacto que admiten las restricciones CHECK de esas columnas.</p>
 */
public enum ProviderCriticality implements DbValueEnum {
    LOW("LOW"),
    MEDIUM("MEDIUM"),
    HIGH("HIGH"),
    CRITICAL("CRITICAL");

    private final String dbValue;

    ProviderCriticality(String dbValue) {
        this.dbValue = dbValue;
    }

    /**
     * Devuelve el texto exacto que se guarda en la base de datos.
     *
     * @return valor de BD de esta criticidad
     */
    @Override
    public String getDbValue() {
        return dbValue;
    }

    /**
     * Traduce el texto leído de la base de datos o del JSON a la constante del enum.
     * La comparación es exacta: {@code "high"} se rechaza.
     *
     * @param value texto a traducir; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide con ningún valor de BD
     */
    public static ProviderCriticality fromDbValue(String value) {
        return DbValueEnum.fromDbValue(ProviderCriticality.class, value);
    }
}
