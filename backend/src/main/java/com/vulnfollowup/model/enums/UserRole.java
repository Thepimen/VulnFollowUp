package com.vulnfollowup.model.enums;

/**
 * Roles permitidos en la plataforma según los requisitos de seguridad RBAC:
 * - ADMIN: Control total del sistema, gestión de usuarios y proveedores TIC.
 * - ANALYST: Registro de vulnerabilidades, evaluación CVSS y cambios en el ciclo de vida.
 * - VIEWER: Consulta en modo lectura de paneles, inventarios e informes.
 */
public enum UserRole {
    ADMIN,
    ANALYST,
    VIEWER
}
