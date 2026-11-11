# Database Architecture & Scripts - VulnFollowUp

Relational database design, DDL scripts, initialization seed files, and Entity-Relationship model documentation for **VulnFollowUp** (PostgreSQL 15+).

---

## Technical Scope & DAM Modules

- **Acceso a Datos (AD)**:
  - Relational schema normalization (3NF) protecting referential integrity.
  - Foreign key constraints with appropriate deletion/update cascades.
  - Efficient indexing on query-intensive columns (CVSS score, vulnerability status, vendor criticality, asset identifier).
  - Many-to-Many (`N:M`) mapping table connecting Vulnerabilities and IT Assets.
  - Third-party ICT Vendor mapping connecting service providers to managed IT assets under DORA Chapter V rules.
  - `CHECK` constraints that enforce CVSS v3.1 / v4.0 coherence (vector prefix and syntax, score range, score to severity scale).
  - Append-only `audit_logs` (triggers reject `UPDATE`, `DELETE` and `TRUNCATE`).

---

## Directory Contents

```
database/
├── schema/
│   └── 01_schema.sql              # DDL: tables, CHECK constraints, triggers and indexes (source of truth)
├── seed/
│   └── 02_seed_data.sql           # Synthetic data: 4 users, 5 providers, 8 assets, 20 vulnerabilities, audit trail
├── er-diagram.md                  # Mermaid source of the E-R model
├── database1-schema.sql           # First draft (kept for history, superseded)
├── database2-schema.sql           # Developer A's PostgreSQL design (kept for history, superseded by schema/01_schema.sql)
├── database-entity-relationship.png
├── database-desing2.png
└── README.md
```

Run order: `schema/01_schema.sql`, then `seed/02_seed_data.sql`. Both scripts are idempotent (the schema drops and recreates its objects).

```
psql -U <user> -d <database> -f database/schema/01_schema.sql
psql -U <user> -d <database> -f database/seed/02_seed_data.sql
```

---

## Core Entities & Relational Map

- `users` (`id`, `username`, `email`, `full_name`, `password_hash`, `role`, `is_active`, ...). No salt column: BCrypt / Argon2id embed the per-user salt inside `password_hash`.
- `ict_providers` (`id`, `provider_code`, `name`, `provided_service`, `criticality`, `is_critical_third_party`, `contract_reference`, `contract_status`, `review_date`, ...)
- `assets` (`id`, `asset_code`, `name`, `asset_type`, `criticality`, `environment`, `ip_address`, `provider_id`, ...) -> `ict_providers` **1:N**
- `vulnerabilities` (`id`, `internal_code`, `cve_id`, `title`, `description`, `status`, `cvss_version`, `cvss_vector`, `cvss_score`, `severity`, `remediation_plan`, `assigned_to`, `resolved_at`, ...)
- `vulnerability_assets` (`vulnerability_id`, `asset_id`, `exposure_status`, `detected_at`, `notes`) -> **N:M**
- `cvss_assessments` (`id`, `vulnerability_id`, `cvss_version`, `cvss_vector`, `cvss_score`, `severity`, `is_current`, `assessed_at`). Only one `is_current` row per vulnerability.
- `remediation_comments` (`id`, `vulnerability_id`, `user_id`, `comment_text`, `evidence_url`)
- `audit_logs` (`id`, `vulnerability_id`, `user_id`, `action_type`, `previous_status`, `new_status`, `justification`, `created_at`). Append-only.

---

## Business Rules Enforced by the Database

| Rule | Mechanism |
|---|---|
| Roles limited to `ADMIN`, `ANALYST`, `VIEWER` | `chk_users_role` |
| No plaintext passwords (BCrypt `$2a$`/`$2b$` or Argon2id only) | `chk_users_password_hash_not_plain` |
| 4-state lifecycle `ABIERTA`, `PENDIENTE DE REMEDIACIÓN`, `RESUELTA`, `CERRADA` | `chk_vuln_lifecycle_status` |
| `resolved_at` set if and only if status is `RESUELTA` or `CERRADA` | `chk_vuln_resolved_at_matches_status` |
| `cve_id` format `CVE-YYYY-NNNN` | `chk_vuln_cve_id_format` |
| CVSS version matches vector prefix and syntax | `chk_vuln_cvss_version_vector_coherence` |
| Score 0.0 to 10.0 and aligned with the FIRST severity scale | `chk_vuln_cvss_score_range`, `chk_vuln_cvss_score_severity_coherence` |
| Single current CVSS assessment per vulnerability | `uq_cvss_assessments_one_current` |
| Critical third party cannot be rated below `HIGH` | `chk_ict_providers_critical_third_party` |
| Audit history cannot be edited or erased | `ON DELETE RESTRICT` + triggers `trg_audit_logs_no_update_delete` / `trg_audit_logs_no_truncate` |

Not enforced in the database (kept in the backend service layer): the allowed status transitions and the rule that every transition appends a row to `audit_logs`.

---

## Seed Data Notes

- All data is **synthetic**. CVE identifiers `CVE-2026-90001` to `CVE-2026-90020` are fictitious.
- CVSS scores were computed with the official FIRST v3.1 and v4.0 formulas from each vector.
- Mandatory SGE demo case: `VFU-0012` (CVSS 9.8, `CRITICAL`, `PENDIENTE DE REMEDIACIÓN`) affects the asset **API de pagos**, provided by **HostingSur S.L.** (contract review on 2026-03-15).
- Every vulnerability has a complete `audit_logs` chain that ends in its current status.
- Demo users use real BCrypt (cost 12) hashes. Their passwords are listed in the header of `02_seed_data.sql`. Change or delete them before any real deployment.
- The JSON datasets in `data/` contain exactly the same records as the SQL seed.
