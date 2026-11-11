package com.vulnfollowup.model.enums;

/**
 * Versiones de CVSS admitidas (3.1 y 4.0).
 *
 * <p>Java no permite un punto en el nombre de una constante, así que se llaman
 * {@code V3_1} y {@code V4_0} y guardan como valor de BD el texto {@code "3.1"} o
 * {@code "4.0"}, tal como exige la restricción CHECK de {@code cvss_assessments.cvss_version}.</p>
 */
public enum CvssVersion implements DbValueEnum {
    V3_1("3.1"),
    V4_0("4.0");

    private final String dbValue;

    CvssVersion(String dbValue) {
        this.dbValue = dbValue;
    }

    /**
     * Devuelve el texto exacto que se guarda en la base de datos.
     *
     * @return {@code "3.1"} o {@code "4.0"}
     */
    @Override
    public String getDbValue() {
        return dbValue;
    }

    /**
     * Traduce el texto leído de la base de datos o del JSON a la constante del enum.
     * La comparación es exacta: solo se aceptan {@code "3.1"} y {@code "4.0"}
     * (el nombre de la constante, como {@code "V3_1"}, se rechaza).
     *
     * @param value texto a traducir; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide con ningún valor de BD
     */
    public static CvssVersion fromDbValue(String value) {
        return DbValueEnum.fromDbValue(CvssVersion.class, value);
    }
}
