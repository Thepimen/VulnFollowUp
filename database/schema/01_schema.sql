-- =============================================================================
-- VulnFollowUp — 3NF Relational Database Schema (PostgreSQL 15+)
-- File: database/schema/01_schema.sql
-- Aligned with: EU DORA Regulation (Chapter V) & FIRST CVSS Base v3.1 / v4.0
-- Audited & Hardened by: Developer B (QA Database Review on Developer A's DDL)
-- =============================================================================

BEGIN;

-- Drop existing tables in reverse dependency order for clean idempotency
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS remediation_comments CASCADE;
DROP TABLE IF EXISTS cvss_assessments CASCADE;
DROP TABLE IF EXISTS vulnerability_assets CASCADE;
DROP TABLE IF EXISTS vulnerabilities CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS ict_providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- 1. TABLE: users
-- Stores platform operators with strict RBAC roles and salted password hashes.
-- Never stores plaintext passwords (enforces BCrypt/Argon2id hash format).
-- =============================================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(120) NOT NULL UNIQUE,
    full_name       VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    password_salt   VARCHAR(128) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role CHECK (
        role IN ('ADMIN', 'ANALYST', 'VIEWER')
    ),
    CONSTRAINT chk_users_password_hash_not_plain CHECK (
        LENGTH(password_hash) >= 50 AND (
            password_hash LIKE '$2a$%' OR
            password_hash LIKE '$2b$%' OR
            password_hash LIKE '$argon2id$%'
        )
    )
);

-- =============================================================================
-- 2. TABLE: ict_providers (SGE Module — EU DORA Regulation Chapter V)
-- Manages third-party ICT service providers, contract references, criticality,
-- and scheduled review dates (e.g., HostingSur S.L. review in March).
-- =============================================================================
CREATE TABLE ict_providers (
    id                   SERIAL PRIMARY KEY,
    provider_code        VARCHAR(20)  NOT NULL UNIQUE,
    name                 VARCHAR(120) NOT NULL UNIQUE,
    provided_service     VARCHAR(150) NOT NULL,
    criticality          VARCHAR(20)  NOT NULL,
    contract_reference   VARCHAR(100) NOT NULL,
    contract_status      VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    review_date          DATE         NOT NULL,
    contact_email        VARCHAR(120) NOT NULL,
    country_code         CHAR(2)      NOT NULL DEFAULT 'ES',
    sla_availability_pct NUMERIC(5,2) NOT NULL DEFAULT 99.90,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_ict_providers_criticality CHECK (
        criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_ict_providers_contract_status CHECK (
        contract_status IN ('ACTIVE', 'UNDER_REVIEW', 'SUSPENDED', 'TERMINATED')
    ),
    CONSTRAINT chk_ict_providers_sla CHECK (
        sla_availability_pct BETWEEN 0.00 AND 100.00
    )
);

-- =============================================================================
-- 3. TABLE: assets
-- Technological asset inventory linked to third-party ICT providers (1:N).
-- =============================================================================
CREATE TABLE assets (
    id               SERIAL PRIMARY KEY,
    asset_code       VARCHAR(40)  NOT NULL UNIQUE,
    name             VARCHAR(120) NOT NULL UNIQUE,
    asset_type       VARCHAR(50)  NOT NULL,
    criticality      VARCHAR(20)  NOT NULL,
    environment      VARCHAR(30)  NOT NULL DEFAULT 'PRODUCTION',
    owner_department VARCHAR(100) NOT NULL,
    ip_address       VARCHAR(45),
    operating_system VARCHAR(80),
    status           VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    provider_id      INT          REFERENCES ict_providers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_assets_type CHECK (
        asset_type IN ('API_SERVICE', 'APPLICATION_SERVER', 'API_GATEWAY', 'WEB_SERVER', 'DATABASE', 'NETWORK_DEVICE', 'BUILD_SERVER', 'IDENTITY_PROVIDER', 'ENDPOINT')
    ),
    CONSTRAINT chk_assets_criticality CHECK (
        criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),
    CONSTRAINT chk_assets_environment CHECK (
        environment IN ('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'DR')
    ),
    CONSTRAINT chk_assets_status CHECK (
        status IN ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED')
    )
);

-- =============================================================================
-- 4. TABLE: vulnerabilities
-- Core defensive vulnerability registry with internal tracking code (VFU-XXXX),
-- optional CVE identifier, strict 4-state lifecycle, and current CVSS Base
-- assessment enforced via SQL CHECK constraints.
-- =============================================================================
CREATE TABLE vulnerabilities (
    id                      SERIAL PRIMARY KEY,
    internal_code           VARCHAR(20)   NOT NULL UNIQUE,
    cve_id                  VARCHAR(30)   UNIQUE,
    title                   VARCHAR(200)  NOT NULL,
    description             TEXT          NOT NULL,
    status                  VARCHAR(30)   NOT NULL DEFAULT 'ABIERTA',
    cvss_version            VARCHAR(10)   NOT NULL,
    cvss_vector             VARCHAR(180)  NOT NULL,
    cvss_score              NUMERIC(3,1)  NOT NULL,
    severity                VARCHAR(20)   NOT NULL,
    remediation_plan        TEXT,
    assigned_to             INT           REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    reported_by             INT           REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    discovered_at           DATE          NOT NULL DEFAULT CURRENT_DATE,
    target_remediation_date DATE,
    resolved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Internal code format: VFU-0001
    CONSTRAINT chk_vuln_internal_code_format CHECK (
        internal_code ~ '^VFU-[0-9]{4,}$'
    ),

    -- Strict 4-state lifecycle required by official specification
    CONSTRAINT chk_vuln_lifecycle_status CHECK (
        status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'CERRADA')
    ),

    -- Supported CVSS Base versions
    CONSTRAINT chk_vuln_cvss_version CHECK (
        cvss_version IN ('3.1', '4.0')
    ),

    -- Score bounds (0.0 to 10.0)
    CONSTRAINT chk_vuln_cvss_score_range CHECK (
        cvss_score >= 0.0 AND cvss_score <= 10.0
    ),

    -- Allowed qualitative severities
    CONSTRAINT chk_vuln_severity_values CHECK (
        severity IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    ),

    -- Strict coherence between cvss_version and cvss_vector prefix/syntax
    CONSTRAINT chk_vuln_cvss_version_vector_coherence CHECK (
        (
            cvss_version = '3.1'
            AND cvss_vector LIKE 'CVSS:3.1/%'
            AND cvss_vector ~ '^CVSS:3\.1/AV:[NALP]/AC:[LH]/PR:[NLH]/UI:[NR]/S:[UC]/C:[NLH]/I:[NLH]/A:[NLH]$'
        )
        OR
        (
            cvss_version = '4.0'
            AND cvss_vector LIKE 'CVSS:4.0/%'
            AND cvss_vector ~ '^CVSS:4\.0/AV:[NALP]/AC:[LH]/AT:[NP]/PR:[NLH]/UI:[NPA]/VC:[NLH]/VI:[NLH]/VA:[NLH]/SC:[NLH]/SI:[NLH]/SA:[NLH]$'
        )
    ),

    -- Strict coherence between numeric cvss_score and qualitative severity (FIRST scale)
    CONSTRAINT chk_vuln_cvss_score_severity_coherence CHECK (
        (cvss_score = 0.0 AND severity = 'NONE') OR
        (cvss_score BETWEEN 0.1 AND 3.9 AND severity = 'LOW') OR
        (cvss_score BETWEEN 4.0 AND 6.9 AND severity = 'MEDIUM') OR
        (cvss_score BETWEEN 7.0 AND 8.9 AND severity = 'HIGH') OR
        (cvss_score BETWEEN 9.0 AND 10.0 AND severity = 'CRITICAL')
    )
);

-- =============================================================================
-- 5. TABLE: vulnerability_assets (Mandatory N:M Associative Table)
-- Links vulnerabilities to affected technological assets.
-- =============================================================================
CREATE TABLE vulnerability_assets (
    vulnerability_id INT          NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    asset_id         INT          NOT NULL REFERENCES assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    exposure_status  VARCHAR(30)  NOT NULL DEFAULT 'AFFECTED',
    detected_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes            VARCHAR(500),

    PRIMARY KEY (vulnerability_id, asset_id),

    CONSTRAINT chk_vuln_assets_exposure_status CHECK (
        exposure_status IN ('AFFECTED', 'MITIGATED', 'PATCHED', 'RISK_ACCEPTED')
    )
);

-- =============================================================================
-- 6. TABLE: cvss_assessments (3NF Historical CVSS Scoring & Re-Assessment Log)
-- Preserves full history of CVSS v3.1 / v4.0 base evaluations per vulnerability.
-- =============================================================================
CREATE TABLE cvss_assessments (
    id               SERIAL PRIMARY KEY,
    vulnerability_id INT          NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    assessed_by      INT          REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    cvss_version     VARCHAR(10)  NOT NULL,
    cvss_vector      VARCHAR(180) NOT NULL,
    cvss_score       NUMERIC(3,1) NOT NULL,
    severity         VARCHAR(20)  NOT NULL,
    is_current       BOOLEAN      NOT NULL DEFAULT TRUE,
    assessed_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_assessment_cvss_version CHECK (
        cvss_version IN ('3.1', '4.0')
    ),
    CONSTRAINT chk_assessment_cvss_score_range CHECK (
        cvss_score >= 0.0 AND cvss_score <= 10.0
    ),
    CONSTRAINT chk_assessment_version_vector_coherence CHECK (
        (
            cvss_version = '3.1'
            AND cvss_vector LIKE 'CVSS:3.1/%'
            AND cvss_vector ~ '^CVSS:3\.1/AV:[NALP]/AC:[LH]/PR:[NLH]/UI:[NR]/S:[UC]/C:[NLH]/I:[NLH]/A:[NLH]$'
        )
        OR
        (
            cvss_version = '4.0'
            AND cvss_vector LIKE 'CVSS:4.0/%'
            AND cvss_vector ~ '^CVSS:4\.0/AV:[NALP]/AC:[LH]/AT:[NP]/PR:[NLH]/UI:[NPA]/VC:[NLH]/VI:[NLH]/VA:[NLH]/SC:[NLH]/SI:[NLH]/SA:[NLH]$'
        )
    ),
    CONSTRAINT chk_assessment_score_severity_coherence CHECK (
        (cvss_score = 0.0 AND severity = 'NONE') OR
        (cvss_score BETWEEN 0.1 AND 3.9 AND severity = 'LOW') OR
        (cvss_score BETWEEN 4.0 AND 6.9 AND severity = 'MEDIUM') OR
        (cvss_score BETWEEN 7.0 AND 8.9 AND severity = 'HIGH') OR
        (cvss_score BETWEEN 9.0 AND 10.0 AND severity = 'CRITICAL')
    )
);

-- =============================================================================
-- 7. TABLE: remediation_comments
-- Technical follow-up notes and mitigation evidence posted by analysts/admins.
-- =============================================================================
CREATE TABLE remediation_comments (
    id               SERIAL PRIMARY KEY,
    vulnerability_id INT          NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id          INT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    comment_text     TEXT         NOT NULL,
    evidence_url     VARCHAR(255),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. TABLE: audit_logs (Immutable Security & Lifecycle Traceability Log)
-- Records every status transition and critical administrative operation.
-- =============================================================================
CREATE TABLE audit_logs (
    id               SERIAL PRIMARY KEY,
    vulnerability_id INT          REFERENCES vulnerabilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id          INT          NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    action_type      VARCHAR(40)  NOT NULL DEFAULT 'STATUS_TRANSITION',
    previous_status  VARCHAR(30),
    new_status       VARCHAR(30),
    justification    TEXT         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_audit_previous_status CHECK (
        previous_status IS NULL OR previous_status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'CERRADA')
    ),
    CONSTRAINT chk_audit_new_status CHECK (
        new_status IS NULL OR new_status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'CERRADA')
    )
);

-- =============================================================================
-- PERFORMANCE & GREEN SOFTWARE COMPOSITE INDEXES
-- Accelerates combined filter queries (severity, status, assigned_to, score)
-- and server-side pagination without full-table scans.
-- =============================================================================
CREATE INDEX idx_vuln_status_severity_score
    ON vulnerabilities (status, severity, cvss_score DESC, id ASC);

CREATE INDEX idx_vuln_assigned_status
    ON vulnerabilities (assigned_to, status, cvss_score DESC);

CREATE INDEX idx_vuln_discovered_pagination
    ON vulnerabilities (discovered_at DESC, id DESC);

CREATE INDEX idx_assets_provider_criticality
    ON assets (provider_id, criticality);

CREATE INDEX idx_vuln_assets_asset_lookup
    ON vulnerability_assets (asset_id, vulnerability_id);

CREATE INDEX idx_cvss_assessments_vuln_current
    ON cvss_assessments (vulnerability_id, is_current);

CREATE INDEX idx_remediation_comments_vuln_date
    ON remediation_comments (vulnerability_id, created_at DESC);

CREATE INDEX idx_audit_logs_vuln_date
    ON audit_logs (vulnerability_id, created_at DESC);

CREATE INDEX idx_ict_providers_review_criticality
    ON ict_providers (criticality, review_date ASC);

COMMIT;
