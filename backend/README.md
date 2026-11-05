# Backend Service - VulnFollowUp API

Backend desarrollado en **Java 21** con **Spring Boot 3** y **Spring Data JPA / Hibernate** para el proyecto intermodular **VulnFollowUp** (2.º DAM).

---

## Qué se ha implementado en el Backend (JPA, Seguridad BCrypt, CRUD y Rollback)

1. **Entidades JPA mapeadas al esquema SQL existente (`com.vulnfollowup.model`)**:
   - `User`: usuarios de la plataforma (tabla `"User"`) con su contraseña cifrada con hash + sal (`password_hash`) y rol RBAC (`UserRole`: `ADMIN`, `ANALYST`, `VIEWER`).
   - `TicProvider`: representa a los proveedores tecnológicos externos bajo la normativa europea DORA (módulo SGE), mapeado a la tabla `"IT_Provider"` y conectado en relación `1:N` con los activos.
   - `Asset`: representa cada activo tecnológico de la empresa (tabla `"Asset"`), conectado con su proveedor TIC (`@ManyToOne`) y con las vulnerabilidades que le afectan (`@ManyToMany`).
   - `Vulnerability`: entidad principal del proyecto (tabla `"Vulnerability"`). Es propietaria de la relación `N:M` con los activos mediante la tabla intermedia `"Asset_Vulnerability"` (`@JoinTable`) y se relaciona `1:1` con su evaluación CVSS.
   - `CvssAssessment`: almacena el cálculo CVSS v3.1 o v4.0 (vector, puntuación `BigDecimal` de `0.0` a `10.0`, severidad y fecha) en la tabla `"CVSS_Assessment"`.
   - `AuditLog`: registra de forma inmutable cada cambio de estado en el ciclo de vida de una vulnerabilidad en la tabla `"Remediation_Audit"` (usuario, estado anterior, estado nuevo, justificación y fecha).

2. **Login con BCrypt y Control de Roles (`com.vulnfollowup.config` y `service.AuthService`)**:
   - Configuración de `BCryptPasswordEncoder(12)` en `SecurityCryptoConfig` (sal aleatoria integrada y coste 12).
   - `AuthService`: registro seguro de usuarios sin guardar nunca contraseñas en texto plano, verificación de credenciales con `passwordEncoder.matches(...)` y validación de permisos según el rol (`ADMIN`, `ANALYST`, `VIEWER`).

3. **Servicio CRUD, Validación CVSS y Ciclo de Vida (`com.vulnfollowup.service.VulnerabilityService`)**:
   - **Motor de coherencia CVSS (v3.1 y v4.0)**: comprueba que la versión (`3.1` o `4.0`) coincida con el prefijo del vector (`CVSS:3.1/` o `CVSS:4.0/`), que la nota esté entre `0.0` y `10.0` y que coincida con la escala oficial de severidad (rechazando casos incoherentes como nota `9.8` con severidad `BAJA`).
   - **Máquina de estados y Auditoría**: valida las transiciones permitidas (`ABIERTA` $\rightarrow$ `PENDIENTE_DE_REMEDIACION` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`, más reapertura `RESUELTA` $\rightarrow$ `ABIERTA`) e inserta automáticamente el registro en `AuditLog` dentro de la misma transacción.

4. **Importación Masiva de JSON con Rollback Transaccional (`importVulnerabilitiesFromJsonFile`)**:
   - Lectura de lotes JSON con Jackson (`ObjectMapper` + `VulnerabilityImportDto`) anotada con `@Transactional(rollbackFor = Exception.class)`.
   - Si cualquier registro del lote falla la validación (por ejemplo, el 4.º registro corrupto de `data/vulnerabilities_invalid_rollback_test.json`), Spring e Hibernate ejecutan **`ROLLBACK` automático** de los registros anteriores para que no queden datos parciales en la base de datos.

5. **Control de concurrencia optimista (PSP) y Rendimiento (`FetchType.LAZY`)**:
   - Campo `@Version private Long version;` en `Vulnerability` para evitar pérdidas de actualización (*lost updates*) si dos analistas editan la misma vulnerabilidad a la vez.
   - Todas las relaciones (`@ManyToOne`, `@OneToMany`, `@ManyToMany` y `@OneToOne`) están en `LAZY` con `spring.jpa.open-in-view=false` para evitar el problema `N+1`.

6. **Pruebas de Integración (`BackendPersistenceAndRollbackTest`)**:
   - Verifica automáticamente el login con BCrypt, el flujo completo de estados con auditoría del caso *HostingSur S.L. (`VFU-0012`)* y el rollback transaccional del JSON corrupto.
