# Data & Batch Import Datasets — VulnFollowUp

This directory contains JSON seed datasets and batch import test files aligned with [`database/schema/01_schema.sql`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/database/schema/01_schema.sql) for testing **Acceso a Datos (AD)** and **Programación de Servicios y Procesos (PSP)** batch ingestion.

---

## Files in `data/`

| File | Records | Purpose |
|---|---|---|
| [`providers_seed.json`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/data/providers_seed.json) | 5 ICT Providers | Initial EU DORA ICT third-party providers, including **#5 «HostingSur S.L.»** (criticality `HIGH`, contract review in **March** `2026-03-15`). |
| [`assets_seed.json`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/data/assets_seed.json) | 8 IT Assets | Technological inventory linked to `ict_providers`, including **#8 «API de pagos»** (`AST-PAY-008`, criticality `HIGH`, linked to `HostingSur S.L.`). |
| [`vulnerabilities_seed.json`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/data/vulnerabilities_seed.json) | 20 Vulnerabilities | Valid initial batch (`VFU-0001` to `VFU-0020`) with CVSS v3.1 & v4.0 vectors, including mandatory demo case **`VFU-0012`** (CVSS **9.8**, `CRITICAL`, state **`PENDIENTE DE REMEDIACIÓN`**, affecting **«API de pagos»**). |
| [`vulnerabilities_invalid_rollback_test.json`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/data/vulnerabilities_invalid_rollback_test.json) | 5 Batch Records (3 Valid + 2 Corrupt) | **Transactional Rollback Proof (AD Defense)**: Starts with 3 valid records (`VFU-0091..VFU-0093`) followed by `VFU-0094` (CVSS v4.0 paired with a `CVSS:3.1/` vector) and `VFU-0095` (score `9.8` paired with severity `LOW`). Demonstrates that a single failed record rolls back the entire transaction without leaving partial data in the database. |

---

## Notes on the datasets

- **All data is synthetic.** The 20 CVE identifiers (`CVE-2026-90001` to `CVE-2026-90020`, and `CVE-2026-90091` to `CVE-2026-90095` in the rollback test) are fictitious and do not match real CVE records. No real vendor or product is attributed with these flaws.
- **CVSS scores are computed, not hand-written.** Every `cvss_score` and `severity` was calculated from its `cvss_vector` with the official FIRST CVSS v3.1 and v4.0 formulas, so batch imports behave the same as the SQL seed.
- **`resolved_at` is required for closed states.** `RESUELTA` and `CERRADA` records must carry an ISO-8601 `resolved_at`; every other state must set it to `null` (enforced by `chk_vuln_resolved_at_matches_status`).
- **`is_critical_third_party`** in `providers_seed.json` marks DORA `CRITICAL_THIRD_PARTY` providers.
- `vulnerabilities_seed.json`, `providers_seed.json` and `assets_seed.json` contain exactly the same data as `database/seed/02_seed_data.sql`.
