package com.vulnfollowup.model.enums;

/**
 * Niveles de gravedad según la puntuación CVSS.
 * Usamos los nombres en español en la lógica de negocio y los relacionamos
 * con los valores del tipo cvss_severity definidos en el script SQL.
 */
public enum CvssSeverity {
    NINGUNA("None"),
    BAJA("Low"),
    MEDIA("Medium"),
    ALTA("High"),
    CRITICA("Critical");

    private final String dbValue;

    CvssSeverity(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    // Traduce el valor leído en la tabla CVSS_Assessment al enum de Java
    public static CvssSeverity fromDbValue(String value) {
        if (value == null) {
            return null;
        }
        for (CvssSeverity severity : values()) {
            if (severity.dbValue.equalsIgnoreCase(value) || severity.name().equalsIgnoreCase(value)) {
                return severity;
            }
        }
        throw new IllegalArgumentException("Severidad CVSS no reconocida: " + value);
    }
}
