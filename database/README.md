# Database Architecture & Scripts - VulnFollowUp

Relational database design, DDL scripts, initialization seed files, and Entity-Relationship model documentation for **VulnFollowUp**.

---

## Technical Scope & DAM Modules

- **Acceso a Datos (AD)**:
  - Relational schema normalization (3NF) protecting referential integrity.
  - Foreign key constraints with appropriate deletion/update cascades.
  - Efficient indexing on query-intensive columns (CVSS score, vulnerability status, vendor criticality, asset identifier).
  - Many-to-Many (`N:M`) mapping table connecting Vulnerabilities and IT Assets.
  - Third-party ICT Vendor mapping connecting service providers to managed IT assets under DORA Chapter V rules.

---

## Directory Contents

```
database/
├── ddl/
│   ├── 01_create_tables.sql       # DDL schema (Users, Assets, Providers, Vulnerabilities, Joins)
│   └── 02_create_indexes.sql      # Performance and search indexes
├── dml/
│   ├── 01_seed_initial_data.sql   # Initial bootstrap data (Admin user, sample assets, providers)
│   └── 02_seed_vulnerabilities.sql# Populated synthetic vulnerabilities (CVSS v3.1 and v4.0)
├── er-diagram/
│   ├── er_diagram.png             # Visual rendering of the Entity-Relationship model
│   └── er_diagram.mermaid         # Mermaid source code of the schema
└── README.md
```

---

## Core Entities & Relational Map

- `users` (`id`, `username`, `password_hash`, `salt`, `role`, `created_at`)
- `assets` (`id`, `name`, `type`, `criticality`, `ip_address`, `provider_id`, `created_at`)
- `ict_providers` (`id`, `company_name`, `service_type`, `dora_criticality`, `contact_email`)
- `vulnerabilities` (`id`, `cve_id`, `title`, `description`, `cvss_version`, `cvss_vector`, `cvss_score`, `severity`, `status`, `remediation_plan`, `created_at`, `updated_at`)
- `vulnerability_assets` (`vulnerability_id`, `asset_id`, `detected_at`, `notes`) -> **N:M**
- `status_history` (`id`, `vulnerability_id`, `previous_status`, `new_status`, `changed_by_user_id`, `change_reason`, `timestamp`)
