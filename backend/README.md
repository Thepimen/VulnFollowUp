# Backend Service - VulnFollowUp API

Backend desarrollado en **Java 21** con **Spring Boot 3** y **Spring Data JPA / Hibernate** para el proyecto intermodular **VulnFollowUp** (2.º DAM).

---

## Qué se ha implementado en esta parte del Backend (JPA / Hibernate)

1. **Entidades JPA mapeadas al esquema SQL existente (`com.vulnfollowup.model`)**:
   - `TicProvider`: representa a los proveedores tecnológicos externos bajo la normativa europea DORA (módulo SGE), mapeado a la tabla `"IT_Provider"` y conectado en relación `1:N` con los activos.
   - `Asset`: representa cada activo tecnológico de la empresa (tabla `"Asset"`), conectado con su proveedor TIC (`@ManyToOne`) y con las vulnerabilidades que le afectan (`@ManyToMany`).
   - `Vulnerability`: entidad principal del proyecto (tabla `"Vulnerability"`). Es propietaria de la relación `N:M` con los activos mediante la tabla intermedia `"Asset_Vulnerability"` (`@JoinTable`) y se relaciona `1:1` con su evaluación CVSS.
   - `CvssAssessment`: almacena el cálculo CVSS v3.1 o v4.0 (vector, puntuación de 0.0 a 10.0, severidad y fecha) en la tabla `"CVSS_Assessment"`.

2. **Control de concurrencia optimista (PSP)**:
   - Se ha incluido el campo `@Version private Long version;` en `Vulnerability` para evitar condiciones de carrera y pérdidas de actualización (*lost updates*) si dos analistas editan la misma vulnerabilidad al mismo tiempo.

3. **Rendimiento y carga perezosa (`FetchType.LAZY`)**:
   - Todas las relaciones (`@ManyToOne`, `@OneToMany`, `@ManyToMany` y `@OneToOne`) están configuradas en `LAZY` para evitar el problema de rendimiento `N+1`.

4. **Enumerados y Convertidores JPA (`com.vulnfollowup.model.enums` y `converter`)**:
   - Uso de `VulnerabilityStatus`, `CvssSeverity`, `CvssVersion` y `ProviderCriticality` junto con `AttributeConverter` para trabajar en Java con los nombres del dominio y guardarlos con el formato exacto del SQL.

5. **Repositorios Spring Data JPA (`com.vulnfollowup.repository`)**:
   - `VulnerabilityRepository`: búsqueda por `cveOrInternalId`, filtrado por `status` (también con soporte de paginación `Pageable`) y consulta JPQL con `JOIN FETCH` para listar las vulnerabilidades pendientes de un proveedor TIC concreto.
   - `AssetRepository`, `TicProviderRepository` y `CvssAssessmentRepository`: operaciones CRUD estándar y filtros auxiliares.

6. **Configuración segura de base de datos (`application.properties`)**:
   - Configurado con `spring.jpa.hibernate.ddl-auto=validate` y `PhysicalNamingStrategyStandardImpl` para validar el esquema real de la base de datos sin modificar ni borrar ninguna tabla.
