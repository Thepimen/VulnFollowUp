# Backend Service - VulnFollowUp API

RESTful API backend for **VulnFollowUp**, responsible for business logic, persistence, and external orchestration under the EU **Digital Operational Resilience Act (DORA)** regulatory framework.

---

## Technical Scope & DAM Modules

- **Acceso a Datos (AD)**:
  - Relational mapping, DAO/Repository patterns, transactional integrity.
  - CRUD operations on IT Assets, Vulnerabilities, Assessments, and ICT Third-Party Providers.
  - Complex queries (N:M relationship: Vulnerabilities $\leftrightarrow$ Assets).
- **Programación de Servicios y Procesos (PSP)**:
  - **Concurrency & Critical Sections**: Thread-safe access to shared in-memory caches and counters with automated race-condition tests.
  - **Asynchronous Workloads (`ExecutorService`)**: Background ingestion of large vulnerability datasets (CVE JSON feeds) and asynchronous report compilation.
  - **Process Orchestration (`ProcessBuilder`)**: Execution of isolated external system utilities to generate sanitized export reports (CSV/HTML/PDF).
- **Sistemas de Gestión Empresarial (SGE)**:
  - DORA Chapter V compliance: Monitoring and risk scoring of Critical Third-Party ICT Providers tied to business-critical IT assets.

---

## Architecture Layers

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/vulnfollowup/
│   │   │   ├── config/          # Security, concurrency thread pools, database configuration
│   │   │   ├── controller/      # REST Endpoints (Auth, Assets, Vulnerabilities, Providers)
│   │   │   ├── service/         # Business logic, CVSS calculators, concurrency handlers
│   │   │   ├── repository/      # Data access layer (DAO / JPA Repositories)
│   │   │   ├── model/           # Entities (Vulnerability, Asset, Provider, User)
│   │   │   ├── dto/             # Data Transfer Objects & validation schemas
│   │   │   └── process/         # ProcessBuilder runners for report generation
│   │   └── resources/
│   │       ├── application.properties
│   │       └── scripts/         # External scripts invoked via ProcessBuilder
│   └── test/
│       └── java/com/vulnfollowup/
│           ├── concurrency/     # Race condition & multi-thread stress tests
│           └── service/         # Unit and integration tests
└── pom.xml (or build.gradle)
```

---

## Authentication & Authorization

- **RBAC Roles**: `ADMIN`, `ANALYST`, `VIEWER`.
- **Security Standard**: Passwords hashed with cryptographic salt (BCrypt / Argon2).
- **Session Management**: JWT (JSON Web Tokens) or secure bearer tokens.
