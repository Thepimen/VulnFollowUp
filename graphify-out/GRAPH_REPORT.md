# Graph Report - VulnFollowUp  (2026-10-21)

## Corpus Check
- Corpus is ~9,671 words - fits in a single context window. You may not need a graph.

## Summary
- 24 nodes · 41 edges · 4 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 3,850 input · 1,920 output

## Community Hubs (Navigation)
- Client Apps, REST API & Accessibility
- Java Backend, Security & PSP Concurrency
- Relational Database & EU DORA Supply Chain
- Vulnerability Lifecycle, Audit & Offline Sync

## God Nodes (most connected - your core abstractions)
1. `database/ (3NF SQL Schema & Seed Scripts)` - 9 edges
2. `backend/ (Java REST API & Business Logic)` - 8 edges
3. `PROJECT_CONTEXT.md (Master Technical Spec)` - 7 edges
4. `Table: vulnerabilities (CVE & CVSS Base v3.1/v4.0)` - 6 edges
5. `Table: assets (Technological Inventory)` - 4 edges
6. `Table: audit_logs (Immutable State History)` - 4 edges
7. `docs/api/ (Paginated REST API Contract)` - 4 edges
8. `desktop-client/ (Enterprise Web/Desktop SPA - WCAG 2.1 AA)` - 4 edges
9. `android-app/ (Android Native Client + Offline Room Cache)` - 4 edges
10. `Table: users (RBAC & BCrypt/Argon2 Hash)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `data/ (CVE/NVD Datasets & Import Templates)` --seeds_and_feeds--> `database/ (3NF SQL Schema & Seed Scripts)`  [EXTRACTED]
  data/README.md → database/README.md
- `CVSS Base Validator (v3.1 & v4.0 Vector/Score/Severity Coherence)` --validates_cvss_v31_v40_for--> `Table: vulnerabilities (CVE & CVSS Base v3.1/v4.0)`  [EXTRACTED]
  PROJECT_CONTEXT.md → database/README.md
- `Room SQLite & DataStore Offline Sync (Android PMDM)` --mirrors_subset_of--> `Table: vulnerabilities (CVE & CVSS Base v3.1/v4.0)`  [INFERRED]
  android-app/README.md → database/README.md
- `PROJECT_CONTEXT.md (Master Technical Spec)` --specifies_architecture_for--> `backend/ (Java REST API & Business Logic)`  [EXTRACTED]
  PROJECT_CONTEXT.md → backend/README.md
- `PROJECT_CONTEXT.md (Master Technical Spec)` --specifies_schema_for--> `database/ (3NF SQL Schema & Seed Scripts)`  [EXTRACTED]
  PROJECT_CONTEXT.md → database/README.md

## Hyperedges (group relationships)
- **EU DORA Supply Chain Risk Traceability (ICT Provider -> Asset -> Vulnerability)** — mod_sge_dora, tbl_ict_providers, tbl_assets, tbl_vulnerability_assets, tbl_vulnerabilities [EXTRACTED]
- **Paginated REST API Contract Across Backend, Desktop SPA, and Android App** — mod_backend, spec_rest_api, mod_desktop_client, mod_android_app, mod_sustainability_wcag [EXTRACTED]

## Communities (4 total, 0 thin omitted)

### Community 0 - "Client Apps, REST API & Accessibility"
Cohesion: 0.36
Nodes (8): GEMINI.md (AI Agent & DevSecOps Rules), PROJECT_CONTEXT.md (Master Technical Spec), README.md (Monorepo Overview), android-app/ (Android Native Client + Offline Room Cache), desktop-client/ (Enterprise Web/Desktop SPA - WCAG 2.1 AA), docs/english/ (English Technical Glossary & Defense Pitch), docs/sostenibilidad/ (Green Software Pagination & WCAG 2.1 AA), docs/api/ (Paginated REST API Contract)

### Community 1 - "Java Backend, Security & PSP Concurrency"
Cohesion: 0.29
Nodes (7): backend/ (Java REST API & Business Logic), data/ (CVE/NVD Datasets & Import Templates), Auth & RBAC Service (JWT + BCrypt/Argon2 + ADMIN/ANALYST/VIEWER), CVSS Base Validator (v3.1 & v4.0 Vector/Score/Severity Coherence), PSP Concurrency Engine (ExecutorService + Shared Resource Lock + Race Test), PSP Report Exporter (ProcessBuilder CSV/HTML Generator), Table: users (RBAC & BCrypt/Argon2 Hash)

### Community 2 - "Relational Database & EU DORA Supply Chain"
Cohesion: 0.70
Nodes (5): database/ (3NF SQL Schema & Seed Scripts), docs/sge/ (EU DORA ICT Third-Party Risk Module), Table: assets (Technological Inventory), Table: ict_providers (SGE - EU DORA Chapter V), Table: vulnerability_assets (N:M Join Table)

### Community 3 - "Vulnerability Lifecycle, Audit & Offline Sync"
Cohesion: 0.67
Nodes (4): Room SQLite & DataStore Offline Sync (Android PMDM), Vulnerability Lifecycle State Machine (ABIERTA -> PENDIENTE -> RESUELTA -> CERRADA), Table: audit_logs (Immutable State History), Table: vulnerabilities (CVE & CVSS Base v3.1/v4.0)

## Knowledge Gaps
- **4 isolated node(s):** `README.md (Monorepo Overview)`, `GEMINI.md (AI Agent & DevSecOps Rules)`, `PSP Report Exporter (ProcessBuilder CSV/HTML Generator)`, `docs/english/ (English Technical Glossary & Defense Pitch)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 4 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PROJECT_CONTEXT.md (Master Technical Spec)` connect `Client Apps, REST API & Accessibility` to `Java Backend, Security & PSP Concurrency`, `Relational Database & EU DORA Supply Chain`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **What connects `README.md (Monorepo Overview)`, `GEMINI.md (AI Agent & DevSecOps Rules)`, `PSP Report Exporter (ProcessBuilder CSV/HTML Generator)` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `database/ (3NF SQL Schema & Seed Scripts)` connect `Relational Database & EU DORA Supply Chain` to `Java Backend, Security & PSP Concurrency`, `Vulnerability Lifecycle, Audit & Offline Sync`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `backend/ (Java REST API & Business Logic)` connect `Java Backend, Security & PSP Concurrency` to `Client Apps, REST API & Accessibility`, `Relational Database & EU DORA Supply Chain`, `Vulnerability Lifecycle, Audit & Offline Sync`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._