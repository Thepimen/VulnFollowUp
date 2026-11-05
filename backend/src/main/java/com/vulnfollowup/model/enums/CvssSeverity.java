package com.vulnfollowup.model.enums;

/**
 * Niveles de gravedad derivados de la puntuación CVSS.
 *
 * <p>El valor de BD coincide con el nombre de la constante y es el texto exacto que
 * admite la restricción CHECK de {@code cvss_assessments.severity}.</p>
 */
public enum CvssSeverity implements DbValueEnum {
    NONE("NONE"),
    LOW("LOW"),
    MEDIUM("MEDIUM"),
    HIGH("HIGH"),
    CRITICAL("CRITICAL");

    private final String dbValue;

    CvssSeverity(String dbValue) {
        this.dbValue = dbValue;
    }

    /**
     * Devuelve el texto exacto que se guarda en la base de datos.
     *
     * @return valor de BD de esta gravedad
     */
    @Override
    public String getDbValue() {
        return dbValue;
    }

    /**
     * Traduce el texto leído de la base de datos o del JSON a la constante del enum.
     * La comparación es exacta: {@code "critical"} se rechaza.
     *
     * @param value texto a traducir; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide con ningún valor de BD
     */
    public static CvssSeverity fromDbValue(String value) {
        return DbValueEnum.fromDbValue(CvssSeverity.class, value);
    }
}
