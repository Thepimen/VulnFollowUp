# VulnFollowUp — HTTP/REST API Contract & Security Specification

> **Machine-Readable Specification**: [`docs/api/openapi.yaml`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/docs/api/openapi.yaml) (OpenAPI 3.1.0)  
> **Database Alignment**: Synchronized 1:1 with [`database/schema/01_schema.sql`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/database/schema/01_schema.sql)  
> **Security Controls**: RFC 7519 JWT Bearer Auth · Strict RBAC (`ADMIN`, `ANALYST`, `VIEWER`) · `additionalProperties: false` mass-assignment protection · CVSS v3.1/v4.0 coherence enforcement.

---

## 1. Role-Based Access Control (RBAC) Matrix per Endpoint

Every endpoint (except `POST /api/auth/login`) requires an `Authorization: Bearer <JWT>` header. Attempting an unauthorized operation returns `403 Forbidden` with error code `FORBIDDEN_ROLE`.

| HTTP Method & Endpoint | Description | `ADMIN` | `ANALYST` | `VIEWER` |
|---|---|:---:|:---:|:---:|
| `POST /api/auth/login` | Authenticate credentials and issue signed JWT | ✅ | ✅ | ✅ |
| `GET /api/dashboard/summary` | Executive KPI aggregations (by severity, status, DORA risk) | ✅ | ✅ | ✅ |
| `GET /api/assets` | Paginated list of technological assets | ✅ | ✅ | ✅ |
| `POST /api/assets` | Register a new technological asset linked to an ICT provider | ✅ | ✅ | ❌ (`403`) |
| `GET /api/vulnerabilities` | Paginated vulnerability search with multi-criteria filters | ✅ | ✅ | ✅ |
| `GET /api/vulnerabilities/{id}` | Retrieve full vulnerability detail, assets, CVSS history & logs | ✅ | ✅ | ✅ |
| `POST /api/vulnerabilities` | Register a new vulnerability (`VFU-XXXX`) & N:M asset links | ✅ | ✅ | ❌ (`403`) |
| `PATCH /api/vulnerabilities/{id}/status` | Transition state (`ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`*) | ✅ *(All)* | ✅ *(Up to `RESUELTA`)* | ❌ (`403`) |
| `POST /api/vulnerabilities/{id}/assessment` | Add new CVSS v3.1 / v4.0 assessment | ✅ | ✅ | ❌ (`403`) |
| `POST /api/vulnerabilities/import` | Concurrent batch JSON import (`ExecutorService` + ACID rollback) | ✅ | ✅ | ❌ (`403`) |
| `GET /api/reports/export` | Export executive CSV/HTML report via OS `ProcessBuilder` | ✅ | ✅ | ❌ (`403`) |
| `GET /api/providers` | List EU DORA ICT providers and computed `doraRiskStatus` | ✅ | ✅ | ✅ |
| `POST /api/providers` | Register new EU DORA ICT third-party provider | ✅ | ❌ (`403`) | ❌ (`403`) |
| `PUT /api/providers/{id}` | Update ICT provider contract status, criticality, or review date | ✅ | ❌ (`403`) | ❌ (`403`) |
| `GET /api/providers/{id}/report` | Generate EU DORA pending vulnerabilities & risk report | ✅ | ✅ | ✅ |

---

## 2. Green Software Pagination & Combined Filtering (`GET /api/vulnerabilities`)

To comply with **Sostenibilidad Aplicada al Sistema Productivo (Green Software)**, returning unbounded collections is strictly prohibited. `GET /api/vulnerabilities` requires server-side pagination (`page`, `size <= 100`, `sort`) backed by the PostgreSQL composite index `idx_vuln_status_severity_score`:

- **Bandwidth & Energy Savings**: Fetching a 10-item summary slice (`~3.4 KB` JSON) instead of loading 5,000 full vulnerability records with nested audit logs (`~8.2 MB` JSON) reduces network data transfer and client DOM memory footprint by **>99.9%**.
- **Supported Query Parameters**:
  - `severity`: `NONE` | `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
  - `status`: `ABIERTA` | `PENDIENTE DE REMEDIACIÓN` | `RESUELTA` | `CERRADA`
  - `assetId`: Integer ID of an affected technological asset
  - `providerId`: Integer ID of an ICT provider (filters via `vulnerability_assets` $\rightarrow$ `assets.provider_id`)
  - `assignedTo`: Integer ID of the assigned analyst
  - `minScore` / `maxScore`: Decimal range (`0.0` to `10.0`)
  - `search`: Substring match on `internal_code` (`VFU-0012`), `cve_id`, or `title`
  - `page` (default `0`), `size` (default `10`, max `100`), `sort` (default `cvssScore,desc`)

### Example Request
```http
GET /api/vulnerabilities?severity=CRITICAL&status=PENDIENTE%20DE%20REMEDIACI%C3%93N&providerId=5&page=0&size=10&sort=cvssScore,desc HTTP/1.1
Host: localhost:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example Response (`200 OK`)
```json
{
  "content": [
    {
      "id": 12,
      "internalCode": "VFU-0012",
      "cveId": "CVE-2024-21762",
      "title": "Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos",
      "status": "PENDIENTE DE REMEDIACIÓN",
      "cvssVersion": "3.1",
      "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "cvssScore": 9.8,
      "severity": "CRITICAL",
      "assignedTo": 2,
      "assignedUsername": "analyst_soc",
      "discoveredAt": "2026-02-10",
      "targetRemediationDate": "2026-03-01",
      "affectedAssetsCount": 2,
      "primaryProviderName": "HostingSur S.L."
    }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

---

## 3. Mandatory SGE Demo Endpoint (`GET /api/providers/5/report` — HostingSur S.L.)

Returns the real-time **EU DORA Chapter V Supply-Chain Risk Assessment** for **«HostingSur S.L.»** (`id = 5`). Because its managed asset **«API de pagos»** (`AST-PAY-008`, criticality `HIGH`) is affected by **`VFU-0012`** (CVSS `9.8`, `CRITICAL`, state `PENDIENTE DE REMEDIACIÓN`), the API automatically marks the provider as `AT_RISK` ahead of its scheduled **March** contract review (`2026-03-15`):

```json
{
  "provider": {
    "id": 5,
    "providerCode": "PROV-005",
    "name": "HostingSur S.L.",
    "providedService": "Alojamiento gestionado y pasarela para API de pagos",
    "criticality": "HIGH",
    "contractReference": "CTR-DORA-2025-HS05",
    "contractStatus": "UNDER_REVIEW",
    "reviewDate": "2026-03-15",
    "contactEmail": "seguridad-dora@hostingsur.es",
    "countryCode": "ES",
    "slaAvailabilityPct": 99.95,
    "managedAssetsCount": 1,
    "activeCriticalHighVulnsCount": 2,
    "doraRiskStatus": "AT_RISK"
  },
  "generatedAt": "2026-02-20T10:30:00Z",
  "doraRiskStatus": "AT_RISK",
  "riskJustification": "Provider HostingSur S.L. (Criticality HIGH, contract review scheduled for March 2026-03-15) hosts 'API de pagos' affected by active CRITICAL vulnerability VFU-0012 (CVSS 9.8) in status 'PENDIENTE DE REMEDIACIÓN'.",
  "managedAssets": [
    {
      "id": 8,
      "assetCode": "AST-PAY-008",
      "name": "API de pagos",
      "assetType": "API_SERVICE",
      "criticality": "HIGH",
      "environment": "PRODUCTION",
      "ownerDepartment": "Medios de Pago y Liquidación",
      "ipAddress": "10.100.15.80",
      "operatingSystem": "Debian 12 Bookworm (Kubernetes 1.30)",
      "status": "ACTIVE",
      "providerId": 5,
      "providerName": "HostingSur S.L.",
      "openVulnerabilitiesCount": 3
    }
  ],
  "pendingVulnerabilities": [
    {
      "id": 12,
      "internalCode": "VFU-0012",
      "cveId": "CVE-2024-21762",
      "title": "Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos",
      "status": "PENDIENTE DE REMEDIACIÓN",
      "cvssVersion": "3.1",
      "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      "cvssScore": 9.8,
      "severity": "CRITICAL",
      "assignedTo": 2,
      "assignedUsername": "analyst_soc",
      "discoveredAt": "2026-02-10",
      "targetRemediationDate": "2026-03-01",
      "affectedAssetsCount": 2,
      "primaryProviderName": "HostingSur S.L."
    }
  ]
}
```

---

## 4. Standard Error Contract (`400`, `401`, `403`, `404`, `409`)

### 4.1. `400 Bad Request` — CVSS Version/Vector/Severity Incoherence
Returned when submitting `POST /api/vulnerabilities` or `POST /api/vulnerabilities/{id}/assessment` with mismatched CVSS attributes:

```json
{
  "timestamp": "2026-02-20T11:05:12Z",
  "status": 400,
  "error": "Bad Request",
  "code": "CVSS_COHERENCE_VIOLATION",
  "message": "CVSS Base validation failed: vector prefix or qualitative severity does not match version/score.",
  "path": "/api/vulnerabilities",
  "details": [
    {
      "field": "cvssVector",
      "issue": "cvssVersion is '4.0' but cvssVector starts with 'CVSS:3.1/'."
    },
    {
      "field": "severity",
      "issue": "cvssScore 9.8 requires severity 'CRITICAL' (9.0-10.0), but received 'LOW'."
    }
  ]
}
```

### 4.2. `403 Forbidden` — Unauthorized Role Action (RBAC Defense Proof)
Returned when a `VIEWER` attempts to modify a vulnerability, or when an `ANALYST` attempts to close (`CERRADA`) a vulnerability or modify an ICT Provider (`PUT /api/providers/{id}`):

```json
{
  "timestamp": "2026-02-20T11:08:45Z",
  "status": 403,
  "error": "Forbidden",
  "code": "FORBIDDEN_ROLE",
  "message": "Role 'ANALYST' is not authorized to transition vulnerability VFU-0012 to 'CERRADA' or modify ICT Providers. Required role: 'ADMIN'.",
  "path": "/api/vulnerabilities/12/status",
  "details": []
}
```
