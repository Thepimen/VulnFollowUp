---
name: relational-database-sql
description: "Designs, validates, and optimizes 3NF relational SQL schemas, N:M join tables (vulnerability_assets), EU DORA ICT provider foreign keys, check constraints for CVSS v3.1/v4.0 and vulnerability lifecycles, and ACID transactional rollbacks. Use when working in database/ or data/ on DDL schemas, seed scripts, indexes, or queries."
---

# Relational Database & SQL Schema Validation (DAM AD / SGE)

## Overview

This skill governs all relational database design, DDL schema creation (`database/schema/`), realistic seed data (`database/seed/`), and query optimization for **VulnFollowUp** (PostgreSQL / MySQL / MariaDB). It enforces Third Normal Form (3NF), referential integrity, domain constraints, and Green Software query efficiency.

## When to Use

- Writing or updating DDL migration/schema scripts in `database/`
- Designing the N:M relationship between `vulnerabilities` and `assets` (`vulnerability_assets`)
- Modeling the EU DORA (SGE) relationship between `ict_providers` and `assets`
- Enforcing database-level `CHECK` constraints for CVSS Base (`3.1` / `4.0`), state transitions, and RBAC roles
- Creating realistic seed data in `database/seed/` or ETL staging datasets in `data/`
- Optimizing SQL pagination and composite indexes

---

## Core Schema Architecture (5 Mandatory Tables)

```
┌─────────────────┐       1 : N       ┌─────────────────────┐
│      users      │──────────────────▶│     audit_logs      │
└─────────────────┘                   └─────────────────────┘
         │                                       ▲
         │ 1 : N (assigned_to / reported_by)     │ 1 : N
         ▼                                       │
┌─────────────────┐       N : M       ┌─────────────────────┐
│ vulnerabilities │◀─────────────────▶│ vulnerability_assets│
└─────────────────┘                   └─────────────────────┘
                                                 │
                                                 │ N : 1
                                                 ▼
┌─────────────────┐       1 : N       ┌─────────────────────┐
│  ict_providers  │──────────────────▶│       assets        │
└─────────────────┘                   └─────────────────────┘
```

### 1. `users` (Authentication & RBAC)
- `id`: Primary Key (`BIGSERIAL` / `BIGINT AUTO_INCREMENT` or `UUID`)
- `username`: `VARCHAR(64) NOT NULL UNIQUE`
- `email`: `VARCHAR(120) NOT NULL UNIQUE`
- `password_hash`: `VARCHAR(255) NOT NULL` — **NEVER store plaintext passwords**. Must hold a salted BCrypt (`$2a$` / `$2b$`) or Argon2id hash.
- `role`: `VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'ANALYST', 'VIEWER'))`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`

### 2. `ict_providers` (SGE Module — EU DORA Regulation Chapter V)
- `id`: Primary Key
- `provider_name`: `VARCHAR(150) NOT NULL UNIQUE`
- `service_type`: `VARCHAR(80) NOT NULL` (e.g., `'CLOUD_IAAS'`, `'SAAS_SECURITY'`, `'DATA_CENTER'`, `'NETWORK_TRANSIT'`, `'IDENTITY_PROVIDER'`)
- `country_iso`: `CHAR(2) NOT NULL` (ISO 3166-1 alpha-2, e.g., `'ES'`, `'IE'`, `'DE'`, `'US'`)
- `risk_level`: `VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))`
- `is_critical_provider`: `BOOLEAN NOT NULL DEFAULT FALSE` (EU DORA critical ICT third-party provider flag)
- `contract_status`: `VARCHAR(30) NOT NULL CHECK (contract_status IN ('ACTIVE', 'UNDER_REVIEW', 'SUSPENDED', 'TERMINATED'))`
- `sla_uptime_pct`: `NUMERIC(5,2) NOT NULL DEFAULT 99.90 CHECK (sla_uptime_pct BETWEEN 0.00 AND 100.00)`
- `last_audit_date`: `DATE`

### 3. `assets` (Technological Asset Inventory)
- `id`: Primary Key
- `asset_code`: `VARCHAR(40) NOT NULL UNIQUE` (e.g., `'SRV-PROD-001'`)
- `hostname`: `VARCHAR(150) NOT NULL`
- `ip_address`: `VARCHAR(45)` (supports IPv4 and IPv6)
- `asset_type`: `VARCHAR(40) NOT NULL CHECK (asset_type IN ('SERVER', 'DATABASE', 'CONTAINER', 'NETWORK_DEVICE', 'WEB_APP', 'ENDPOINT'))`
- `environment`: `VARCHAR(20) NOT NULL CHECK (environment IN ('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'DR'))`
- `criticality`: `VARCHAR(20) NOT NULL CHECK (criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))`
- `provider_id`: Foreign Key $\rightarrow$ `ict_providers(id) ON DELETE RESTRICT ON UPDATE CASCADE` (nullable only for strictly on-premise self-managed hardware, though DORA tracking encourages explicit provider mapping).

### 4. `vulnerabilities` (Core Vulnerability Registry)
- `id`: Primary Key
- `cve_id`: `VARCHAR(25) NOT NULL UNIQUE` (e.g., `'CVE-2024-3094'`)
- `title`: `VARCHAR(200) NOT NULL`
- `description`: `TEXT NOT NULL`
- `cvss_version`: `VARCHAR(10) NOT NULL CHECK (cvss_version IN ('3.1', '4.0'))`
- `cvss_vector`: `VARCHAR(180) NOT NULL`
  - Enforce prefix coherence in SQL:
    ```sql
    CONSTRAINT chk_cvss_vector_prefix CHECK (
        (cvss_version = '3.1' AND cvss_vector LIKE 'CVSS:3.1/%') OR
        (cvss_version = '4.0' AND cvss_vector LIKE 'CVSS:4.0/%')
    )
    ```
- `cvss_score`: `NUMERIC(3,1) NOT NULL CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0)`
- `severity`: `VARCHAR(20) NOT NULL CHECK (severity IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))`
  - Enforce score-to-severity coherence in SQL:
    ```sql
    CONSTRAINT chk_cvss_severity_coherence CHECK (
        (cvss_score = 0.0 AND severity = 'NONE') OR
        (cvss_score BETWEEN 0.1 AND 3.9 AND severity = 'LOW') OR
        (cvss_score BETWEEN 4.0 AND 6.9 AND severity = 'MEDIUM') OR
        (cvss_score BETWEEN 7.0 AND 8.9 AND severity = 'HIGH') OR
        (cvss_score BETWEEN 9.0 AND 10.0 AND severity = 'CRITICAL')
    )
    ```
- `status`: `VARCHAR(30) NOT NULL DEFAULT 'ABIERTA' CHECK (status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'CERRADA'))`
- `discovered_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `remediated_at`: `TIMESTAMP WITH TIME ZONE`
- `assigned_to`: Foreign Key $\rightarrow$ `users(id) ON DELETE SET NULL`

### 5. `vulnerability_assets` (N:M Associative Table)
- Composite Primary Key `(vulnerability_id, asset_id)`
- `vulnerability_id`: Foreign Key $\rightarrow$ `vulnerabilities(id) ON DELETE CASCADE`
- `asset_id`: Foreign Key $\rightarrow$ `assets(id) ON DELETE RESTRICT`
- `exposure_status`: `VARCHAR(30) NOT NULL DEFAULT 'AFFECTED' CHECK (exposure_status IN ('AFFECTED', 'MITIGATED', 'PATCHED', 'ACCEPTED_RISK'))`
- `detected_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `notes`: `VARCHAR(500)`

### 6. `audit_logs` (Traceability & State Change History)
- `id`: Primary Key
- `vulnerability_id`: Foreign Key $\rightarrow$ `vulnerabilities(id) ON DELETE CASCADE`
- `changed_by`: Foreign Key $\rightarrow$ `users(id) ON DELETE RESTRICT`
- `previous_status`: `VARCHAR(30)`
- `new_status`: `VARCHAR(30) NOT NULL`
- `justification`: `TEXT NOT NULL`
- `changed_at`: `TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP`

---

## Green Software Indexing & Pagination Rules

1. **Mandatory Composite Indexes**:
   - `CREATE INDEX idx_vuln_status_severity_score ON vulnerabilities (status, severity, cvss_score DESC);`
   - `CREATE INDEX idx_assets_provider_criticality ON assets (provider_id, criticality);`
   - `CREATE INDEX idx_vuln_assets_asset_id ON vulnerability_assets (asset_id);`
2. **No `SELECT *` in Paginated Lists**:
   - Project only the columns required by the table view (`id, cve_id, title, cvss_version, cvss_score, severity, status, discovered_at`) to reduce database I/O and JSON serialization overhead.
3. **Transactional Rollback Verification**:
   - When inserting a new vulnerability along with its N:M `vulnerability_assets` links and initial `audit_logs` entry, wrap all statements in a single transaction (`BEGIN ... COMMIT` / `ROLLBACK`) so a constraint failure on any table leaves zero partial records.
