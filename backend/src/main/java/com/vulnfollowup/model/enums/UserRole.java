package com.vulnfollowup.model.enums;

/**
 * Roles permitidos en la plataforma según los requisitos de seguridad RBAC:
 * <ul>
 *   <li>ADMIN: control total del sistema, gestión de usuarios y proveedores TIC.</li>
 *   <li>ANALYST: registro de vulnerabilidades, evaluación CVSS y cambios en el ciclo de vida.</li>
 *   <li>VIEWER: consulta en modo lectura de paneles, inventarios e informes.</li>
 * </ul>
 *
 * <p>El valor de BD coincide con el nombre de la constante y es el texto exacto que
 * admite la restricción CHECK de {@code users.role}.</p>
 */
public enum UserRole implements DbValueEnum {
    ADMIN("ADMIN"),
    ANALYST("ANALYST"),
    VIEWER("VIEWER");

    private final String dbValue;

    UserRole(String dbValue) {
        this.dbValue = dbValue;
    }

    /**
     * Devuelve el texto exacto que se guarda en la base de datos.
     *
     * @return valor de BD de este rol
     */
    @Override
    public String getDbValue() {
        return dbValue;
    }

    /**
     * Traduce el texto leído de la base de datos o del JSON a la constante del enum.
     * La comparación es exacta: {@code "admin"} se rechaza.
     *
     * @param value texto a traducir; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide con ningún valor de BD
     */
    public static UserRole fromDbValue(String value) {
        return DbValueEnum.fromDbValue(UserRole.class, value);
    }
}
