# Database Architecture & Scripts — VulnFollowUp

Relational database design (PostgreSQL 15+), 3NF DDL scripts, seed datasets, and Entity-Relationship documentation for **VulnFollowUp**.

---

## Directory Structure

```text
database/
├── schema/
│   └── 01_schema.sql                  # Canonical 3NF DDL schema, CHECK constraints & composite indexes
├── seed/
│   └── 02_seed_data.sql               # 20 realistic vulnerabilities (incl. VFU-0012 + HostingSur S.L.), users, assets, audits
├── er-diagram.md                      # Mermaid Entity-Relationship diagram synchronized 100% with 01_schema.sql
├── database1-schema.sql               # Initial iteration by Developer A
├── database2-schema.sql               # Second PostgreSQL iteration by Developer A (links to schema/01_schema.sql)
├── database-entity-relationship.png   # Initial visual E-R diagram (Developer A)
├── database-desing2.png               # Second visual E-R diagram (Developer A)
└── README.md
```

---

## QA Database Audit Summary (Developer B Review on Developer A's Commits)

1. **3NF Normalization & Naming Standardization**:
   - Standardized all 8 tables in snake_case (`users`, `ict_providers`, `assets`, `vulnerabilities`, `vulnerability_assets`, `cvss_assessments`, `remediation_comments`, `audit_logs`), avoiding reserved SQL keyword collisions (`"User"`).
   - Added explicit `password_salt` alongside `password_hash` (`CHECK` enforcing salted BCrypt `$2a$`/`$2b$` or `$argon2id$` hashes).
   - Added `internal_code` (`VFU-0001` format) alongside `cve_id` in `vulnerabilities`.
   - Separated follow-up notes (`remediation_comments`) from immutable state/security audit logs (`audit_logs`).
2. **Lifecycle & CVSS Base v3.1/v4.0 `CHECK` Constraints**:
   - Enforced the 4 official lifecycle states: `'ABIERTA'`, `'PENDIENTE DE REMEDIACIÓN'`, `'RESUELTA'`, `'CERRADA'`.
   - Enforced strict vector prefix and regular expression validation matching `cvss_version` (`3.1` vs `4.0`) and FIRST score-to-severity coherence (`0.0 = NONE`, `0.1–3.9 = LOW`, `4.0–6.9 = MEDIUM`, `7.0–8.9 = HIGH`, `9.0–10.0 = CRITICAL`).
3. **Green Software Composite Indexes**:
   - Added 8 composite indexes (`idx_vuln_status_severity_score`, `idx_vuln_assigned_status`, `idx_vuln_discovered_pagination`, `idx_assets_provider_criticality`, etc.) to accelerate multi-filter paginated queries.
4. **Mandatory SGE Case (`HostingSur S.L.` + `API de pagos` + `VFU-0012`)**:
   - Seeded in [`seed/02_seed_data.sql`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/database/seed/02_seed_data.sql) and [`data/`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/data/README.md).
