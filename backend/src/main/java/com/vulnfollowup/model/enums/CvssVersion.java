package com.vulnfollowup.model.enums;

/**
 * Versiones de CVSS que admitimos en el proyecto (3.1 y 4.0).
 * Como en Java no podemos poner un punto en el nombre de una constante,
 * las llamamos V3_1 y V4_0 y guardamos el texto "3.1" o "4.0" para la BD.
 */
public enum CvssVersion {
    V3_1("3.1"),
    V4_0("4.0");

    private final String dbValue;

    CvssVersion(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static CvssVersion fromDbValue(String value) {
        if (value == null) {
            return null;
        }
        for (CvssVersion version : values()) {
            if (version.dbValue.equals(value) || version.name().equalsIgnoreCase(value)) {
                return version;
            }
        }
        throw new IllegalArgumentException("Versión CVSS no soportada (solo 3.1 o 4.0): " + value);
    }
}
