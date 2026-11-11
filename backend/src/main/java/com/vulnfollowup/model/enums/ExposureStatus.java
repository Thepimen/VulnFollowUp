package com.vulnfollowup.model.enums;

/**
 * Estado de exposición de un activo frente a una vulnerabilidad concreta.
 *
 * <p>Se guarda en la tabla de vínculos {@code vulnerability_assets.exposure_status}.
 * El valor de BD coincide con el nombre de la constante y es el texto exacto que
 * admite la restricción CHECK de esa columna.</p>
 * <ul>
 *   <li>AFFECTED: el activo está afectado.</li>
 *   <li>MITIGATED: se aplicó una medida que reduce el riesgo.</li>
 *   <li>PATCHED: el activo ya está parcheado.</li>
 *   <li>RISK_ACCEPTED: el riesgo se acepta de forma consciente.</li>
 * </ul>
 */
public enum ExposureStatus implements DbValueEnum {
    AFFECTED("AFFECTED"),
    MITIGATED("MITIGATED"),
    PATCHED("PATCHED"),
    RISK_ACCEPTED("RISK_ACCEPTED");

    private final String dbValue;

    ExposureStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    /**
     * Devuelve el texto exacto que se guarda en la base de datos.
     *
     * @return valor de BD de este estado de exposición
     */
    @Override
    public String getDbValue() {
        return dbValue;
    }

    /**
     * Traduce el texto leído de la base de datos o del JSON a la constante del enum.
     * La comparación es exacta: {@code "affected"} se rechaza.
     *
     * @param value texto a traducir; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide con ningún valor de BD
     */
    public static ExposureStatus fromDbValue(String value) {
        return DbValueEnum.fromDbValue(ExposureStatus.class, value);
    }
}
