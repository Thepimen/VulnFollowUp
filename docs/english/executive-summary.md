# VulnFollowUp — Executive Summary (English Module Deliverable)

> **Project Title**: VulnFollowUp — Defensive Vulnerability & ICT Third-Party Risk Governance Platform  
> **Academic Program**: 2nd Year Higher Technician in Multiplatform Application Development (*2.º CFGS Desarrollo de Aplicaciones Multiplataforma — DAM*)  
> **Regulatory & Technical Frameworks**: Regulation (EU) 2022/2554 (**DORA**) · FIRST **CVSS Base v3.1 & v4.0** · **WCAG 2.1 Level AA** · **Green Software Engineering**

---

## 1. Problem Statement & Market Need

Financial institutions, insurance providers, and regulated European SMEs face an unprecedented operational challenge under the **Digital Operational Resilience Act (Regulation (EU) 2022/2554 — DORA)**: they must not only track technical vulnerabilities across their internal servers and APIs, but also continuously audit the cybersecurity posture of their **third-party ICT service providers** (cloud hosts, payment gateways, and managed security vendors).

Most small and medium-sized security teams either rely on fragmented spreadsheets—which lack referential integrity, audit trails, and CVSS validation—or purchase heavyweight offensive/SIEM suites that are overly complex, expensive, and disconnected from third-party contract review cycles.

---

## 2. Our Solution: VulnFollowUp

**VulnFollowUp** is a purpose-built, strictly **defensive** multiplatform governance system that bridges **Application Security (CVSS v3.1/v4.0 triage)** and **Enterprise ICT Vendor Risk Management (DORA Chapter V)** within a unified, accessible, and resource-efficient architecture:

1. **3NF Relational Persistence & Mathematical CVSS Integrity (`database/`)**:
   - Backed by an 8-table **PostgreSQL** database in Third Normal Form (`users`, `ict_providers`, `assets`, `vulnerabilities`, `vulnerability_assets` N:M join table, `cvss_assessments`, `remediation_comments`, and `audit_logs`).
   - Enforces strict SQL `CHECK` constraints and regular expressions that prevent invalid CVSS vectors (such as pairing `cvss_version = '4.0'` with a `CVSS:3.1/` vector) or incoherent severity ratings (such as labeling a `9.8` score as `LOW`), backed by full ACID transactional rollback protection.
2. **High-Concurrency Java REST Backend (`backend/`)**:
   - Implements stateless **JWT authentication**, salted **BCrypt/Argon2id** password hashing, and granular **Role-Based Access Control (`ADMIN`, `ANALYST`, `VIEWER`)**.
   - Leverages bounded **`ExecutorService` thread pools** and thread-safe synchronization primitives (`ReentrantLock` / `AtomicInteger`, verified with deterministic JUnit 5 `CountDownLatch` race-condition tests) for parallel CVE batch ingestion, alongside safe **`ProcessBuilder`** OS process execution for CSV and HTML executive reporting.
3. **Real-Time EU DORA Supply-Chain Risk Engine (`docs/sge/`)**:
   - Automatically evaluates third-party ICT providers (`GET /api/providers/{id}/report`). When a critical asset such as **«API de pagos»** hosted by **«HostingSur S.L.»** is affected by an unresolved critical vulnerability (**`VFU-0012`**, CVSS **9.8**, status **`PENDIENTE DE REMEDIACIÓN`**), the platform automatically flags the provider as **`AT_RISK`** ahead of its scheduled **March** contract review.
4. **Accessible Desktop SPA (`desktop-client/`) & Offline-First Android App (`android-app/`)**:
   - The **React + TypeScript + Vite SPA** delivers a high-contrast Bento telemetry interface compliant with **WCAG 2.1 Level AA** ($\ge 4.5:1$ contrast in both Dark and Light modes, full keyboard navigation, and non-color-only severity badges).
   - The **Android Native client** uses local **Room (SQLite)** persistence and **DataStore** so field analysts can inspect vulnerabilities and queue remediation notes even without network connectivity.

---

## 3. Alignment with Green Software & Sustainable Development Goals (SDGs)

VulnFollowUp embeds **Green Software Engineering** directly into its technical design:
- **Mandatory Server-Side Pagination (`page`, `size <= 100`)** and **Composite SQL Indexes** cut HTTP JSON payload sizes by **>99%** compared to unpaginated queries, reducing network and client CPU energy consumption (**SDG 9 & SDG 12**).
- **OLED-Friendly Dark Mode** and **WCAG 2.1 Level AA** ensure digital inclusion and reduced visual fatigue for security operators (**SDG 8 & SDG 16**).
