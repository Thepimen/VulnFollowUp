# REST API Contract & Specification - VulnFollowUp

Comprehensive documentation of the HTTP REST API contracts for the **VulnFollowUp** platform.

---

## Base Configuration

- **Default Base URL**: `http://localhost:8080/api`
- **Data Exchange Format**: `application/json; charset=utf-8`
- **Authentication**: Bearer Token / JWT header: `Authorization: Bearer <token>`

---

## Core Endpoints Specification

### 1. Authentication
- `POST /api/auth/login`
  - **Description**: Authenticate user and issue JWT token.
  - **Request Body**:
    ```json
    {
      "username": "analyst_sarah",
      "password": "SecurePassword123!"
    }
    ```
  - **Success Response (200 OK)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "username": "analyst_sarah",
      "role": "ANALYST",
      "expiresInSeconds": 86400
    }
    ```

### 2. Assets Management
- `GET /api/assets`
  - **Description**: Retrieve list of monitored IT assets and their associated ICT provider.
  - **Query Parameters**: `?type=APPLICATION_SERVER&criticality=TIER_1_CRITICAL`
  - **Success Response (200 OK)**: Array of asset objects.

### 3. Vulnerabilities Lifecycle
- `GET /api/vulnerabilities`
  - **Description**: Paginated and filtered vulnerability query (optimized for low bandwidth / sustainability).
  - **Query Parameters**: `?page=0&size=20&status=ABIERTA&severity=CRITICAL&sort=cvssScore,desc`
  - **Success Response (200 OK)**:
    ```json
    {
      "content": [ ... ],
      "page": 0,
      "size": 20,
      "totalElements": 20,
      "totalPages": 1
    }
    ```
- `GET /api/vulnerabilities/{id}`
  - **Description**: Retrieve complete vulnerability details including CVSS vector breakdown and affected assets.
- `POST /api/vulnerabilities`
  - **Description**: Register a new vulnerability.
  - **Roles**: `ADMIN`, `ANALYST`.
  - **Validation Rules**: CVSS vector prefix must match version, score must match vector calculation, severity must align with CVSS score tier.
- `PATCH /api/vulnerabilities/{id}/status`
  - **Description**: Transition vulnerability through its formal lifecycle.
  - **Allowed Lifecycle**: `ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`.
  - **Request Body**:
    ```json
    {
      "newStatus": "PENDIENTE DE REMEDIACIÓN",
      "reason": "Security patch scheduled for maintenance window."
    }
    ```
- `POST /api/vulnerabilities/{id}/assessment`
  - **Description**: Attach or update remediation notes, risk assessment, and compensating controls.

### 4. Dashboard & Metrics
- `GET /api/dashboard/summary`
  - **Description**: High-level KPI metrics (counts by status, severity distribution, top vulnerable assets, DORA risk score).

### 5. DORA ICT Third-Party Providers (SGE)
- `GET /api/providers`
  - **Description**: List all registered third-party ICT service providers and criticality classifications.
- `POST /api/providers`
  - **Description**: Register a new ICT service vendor under DORA Chapter V.
- `GET /api/providers/{id}/report`
  - **Description**: Generate and download consolidated DORA compliance and risk dependency report (triggered asynchronously).

---

## Standard Error Response Format (RFC 7807)

```json
{
  "timestamp": "2026-10-16T09:20:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "CVSS vector 'CVSS:3.1/...' is inconsistent with CVSS version '4.0'.",
  "path": "/api/vulnerabilities"
}
```
