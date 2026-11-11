# Acta de Reunión #01 — Kick-Off de Proyecto y Cierre de Arquitectura Fase 1

## 1. Datos Generales de la Sesión

| Campo | Detalle |
| :--- | :--- |
| **Proyecto** | **VulnFollowUp** — Plataforma Defensiva de Seguimiento de Vulnerabilidades y Gestión de Proveedores TIC (DORA & CVSS v3.1/v4.0) |
| **Código de Acta** | `ACTA-VFU-2026-01` |
| **Fecha y Hora** | 04 de noviembre de 2026 — 10:00 a 11:30 CET |
| **Modalidad** | Sesión técnica síncrona + revisión de ramas Git (`origin/feat/database-schema-and-seed` y `origin/develop`) |
| **Asistentes** | - **Developer A (`NoeCB`)** — *Responsable de Backend Core, Concurrencia y Esquema Preliminar BD*<br>- **Developer B (`luisl`)** — *Responsable de Arquitectura DevSecOps, Auditoría QA 3NF, Contrato OpenAPI, Clientes SPA/Android y Módulos Transversales* |
| **Estado del Acta** | **APROBADA POR UNANIMIDAD** |

---

## 2. Orden del Día (Agenda)

1. Revisión del alcance normativo del proyecto intermodular (orientación 100 % defensiva, Reglamento europeo **DORA** y estándares **CVSS v3.1 / v4.0**).
2. Auditoría técnica y consolidación del esquema relacional **3NF** en `database/schema/01_schema.sql` y juego de datos semilla (`02_seed_data.sql` y `data/*.json`).
3. Aprobación del contrato formal **OpenAPI 3.1** (`docs/api/openapi.yaml`) para desacoplar el desarrollo paralelo de Backend, Cliente Escritorio y App Android.
4. Acuerdos de pila tecnológica (*Tech Stack*), estrategia de ramas **Gitflow** y estándares de accesibilidad (**WCAG 2.1 AA**) y sostenibilidad (**Green Software**).
5. Asignación de tareas y fechas de entrega para el cierre de la Fase 1 y arranque de la Fase 2.

---

## 3. Acuerdos Técnicos Adoptados

### Acuerdo 1: Consolidación del Esquema SQL en 3.ª Forma Normal (3NF) y Caso Oficial SGE
- Se revisaron los diseños iniciales subidos por Developer A (`database1-schema.sql` y `database2-schema.sql`) y se consolidaron en el script canónico [`database/schema/01_schema.sql`](../../database/schema/01_schema.sql).
- **Decisiones clave de esquema**:
  1. Se estandarizan los nombres de tablas en `snake_case` plural (`users`, `ict_providers`, `assets`, `vulnerabilities`, `vulnerability_assets`, `cvss_assessments`, `remediation_comments`, `audit_logs`).
  2. Se fija la restricción `CHECK` de estados del ciclo de vida exactamente a los 4 valores oficiales en español exigidos por la rúbrica: `'ABIERTA'`, `'PENDIENTE DE REMEDIACIÓN'`, `'RESUELTA'` y `'CERRADA'`.
  3. Se incorporan restricciones `CHECK` en base de datos para impedir incoherencias entre versión CVSS (`3.1` vs `4.0`), prefijo y métricas obligatorias del vector (`^CVSS:3\.1/...` vs `^CVSS:4\.0/...`), rango de puntuación (`0.0` a `10.0`) y severidad (`NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  4. Se incluye en [`database/seed/02_seed_data.sql`](../../database/seed/02_seed_data.sql) y en [`data/vulnerabilities_seed.json`](../../data/vulnerabilities_seed.json) el caso obligatorio de demostración SGE: el proveedor **«HostingSur S.L.»**, que presta el activo **«API de pagos»** (criticidad `HIGH`, revisión de contrato prevista para marzo `2026-03-15`), afectado por la vulnerabilidad **`VFU-0012`** (CVSS **9.8**, **Crítica**) en estado **`PENDIENTE DE REMEDIACIÓN`**.
  5. Se incorpora el fichero [`data/vulnerabilities_invalid_rollback_test.json`](../../data/vulnerabilities_invalid_rollback_test.json) con 3 registros válidos y un 4.º registro deliberadamente corrupto para demostrar el `ROLLBACK` transaccional en el módulo de Acceso a Datos.

### Acuerdo 2: Contrato API "Contract-First" mediante OpenAPI 3.1
- Se aprueba [`docs/api/openapi.yaml`](../api/openapi.yaml) como única fuente de verdad entre el servidor y los clientes.
- Todos los listados de colecciones devolverán la envolvente paginada `PageResponse<T>` (`content`, `page`, `size`, `totalElements`, `totalPages`) con límite máximo de `size = 100` y valor por defecto `size = 20`.
- Los errores HTTP utilizarán un esquema uniforme (`timestamp`, `status`, `error`, `code`, `message`, `path`, `details`) para los códigos `400`, `401`, `403`, `404` y `409`.

### Acuerdo 3: Pila Tecnológica y Reglas de Calidad (`GEMINI.md`)
- **Cliente de Escritorio (`desktop-client/`)**: React 18 + TypeScript + Vite con variables CSS semánticas que garantizan contraste **WCAG 2.1 AA** tanto en modo oscuro (*Enterprise Dark*) como en modo claro (*High-Craft Light*), e indicadores de severidad/estado con forma + icono SVG + etiqueta textual (nunca solo color).
- **Flujo Gitflow**: Ningún desarrollador hará commits directos en `main`. Toda funcionalidad se desarrolla en ramas `feat/*` o `docs/*` con *Conventional Commits* y se integra en `develop` mediante `git merge --no-ff`.

---

## 4. Compromisos y Próximos Pasos (Action Items)

| ID | Tarea Comprometida | Responsable | Rama Git | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **AI-01** | Auditar y publicar `01_schema.sql`, `02_seed_data.sql`, `er-diagram.md` y JSON de rollback, e integrar en `develop`. | Developer B (`luisl`) & Developer A (`NoeCB`) | `feat/database-schema-and-seed` | Completado |
| **AI-02** | Redactar especificación `docs/api/openapi.yaml` y guía `docs/api/README.md` en inglés técnico. | Developer B (`luisl`) | `feat/frontend-wireframes-and-setup` | Completado |
| **AI-03** | Inicializar `desktop-client/` (React + TS + Vite) con rutas, badges accesibles WCAG 2.1 AA y vista SGE de proveedores. | Developer B (`luisl`) | `feat/frontend-wireframes-and-setup` | Completado |
| **AI-04** | Elaborar entregables transversales de Fase 1 (`SGE`, `Inglés`, `IPE II`, `Digitalización`, `Sostenibilidad`) y actualizar grafo `graphify`. | Developer B (`luisl`) | `docs/transversales-init` -> `develop` | Completado |
| **AI-05** | **Arranque Fase 2**: Crear rama `feat/backend-core-setup` desde `develop` para implementar entidades/DAOs, autenticación BCrypt y endpoints REST. | Developer A (`NoeCB`) & Developer B (`luisl`) | `feat/backend-core-setup` | Próximo paso inmediato |

---

*Firmado digitalmente por el equipo del proyecto VulnFollowUp — Curso 2026/2027 (2.º DAM).*
