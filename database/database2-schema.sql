-- =============================================================================
-- VulnFollowUp — Developer A PostgreSQL Schema (Audited & Normalized by Dev B)
-- See canonical production schema at: database/schema/01_schema.sql
-- =============================================================================
-- Note: This file preserves Developer A's second iteration while upgrading enum
-- states to the official Spanish lifecycle ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN',
-- 'RESUELTA', 'CERRADA') and adding strict CVSS v3.1/v4.0 CHECK constraints and
-- composite indexes. For automated deployment, execute database/schema/01_schema.sql.

\i schema/01_schema.sql
