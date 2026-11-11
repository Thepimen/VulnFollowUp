-- =============================================================================
-- VulnFollowUp — Synthetic Seed Data & Official SGE Demo Case (PostgreSQL 15+)
-- File: database/seed/02_seed_data.sql
-- Requires: database/schema/01_schema.sql (run it first)
--
-- ALL DATA IS FICTITIOUS. The 20 CVE identifiers (CVE-2026-90001 .. CVE-2026-90020)
-- are SYNTHETIC: they do not correspond to real CVE records and no real vendor
-- or product is attributed with these flaws. Scores and severities were computed
-- from the vectors with the official FIRST CVSS v3.1 / v4.0 formulas.
--
-- Includes:
--   • 4 demo users (ADMIN, ANALYST x2, VIEWER) with real BCrypt ($2b$12$) hashes
--   • 5 ICT providers under EU DORA (including mandatory "HostingSur S.L.")
--   • 8 technological assets (including mandatory "API de pagos" -> HostingSur)
--   • 20 synthetic vulnerabilities VFU-0001..VFU-0020 (3.1 and 4.0 vectors)
--       status mix: 6 ABIERTA, 6 PENDIENTE DE REMEDIACIÓN, 3 RESUELTA, 5 CERRADA
--       severity mix: 7 CRITICAL, 7 HIGH, 4 MEDIUM, 2 LOW
--     including mandatory case VFU-0012 (CVSS 9.8, CRITICAL, PENDIENTE DE REMEDIACIÓN)
--     affecting "API de pagos" of "HostingSur S.L."
--   • N:M links (vulnerability_assets), CVSS history (cvss_assessments),
--     follow-up notes (remediation_comments) and a COMPLETE audit_logs trail:
--     every status transition of every vulnerability is recorded.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. SEED USERS (Roles: ADMIN, ANALYST, VIEWER)
-- DEMO credentials (BCrypt cost 12; the salt is embedded in the hash itself).
-- Change or delete these accounts before any real deployment.
--   • admin_dora     -> AdminDora#2026!
--   • analyst_soc    -> AnalystSoc#2026!
--   • analyst_appsec -> AnalystApp#2026!
--   • auditor_viewer -> ViewerDora#2026!
-- =============================================================================
INSERT INTO users (id, username, email, full_name, password_hash, role, is_active) VALUES
(1, 'admin_dora', 'ciso.admin@vulnfollowup.eu', 'Elena Vázquez (CISO / DORA Lead)', '$2b$12$X.CxyA/YXYlN1e5tPPXlNeUccnEBpdG5fOWXlEUPqwZh1t6bFZU.W', 'ADMIN', TRUE),
(2, 'analyst_soc', 'carlos.mendez@vulnfollowup.eu', 'Carlos Méndez (Senior SOC Analyst)', '$2b$12$Fa.nGP2TgH.dniXfv8W2FO4RA.Z1u.vCxKtdHwn3ukxY0ZQsA4uTW', 'ANALYST', TRUE),
(3, 'analyst_appsec', 'laura.gomez@vulnfollowup.eu', 'Laura Gómez (AppSec Engineer)', '$2b$12$ECfPg.KG5BUZZD8l3n4OS.XSTgK4jpPadBzExxH5.yJVq9VFm8CHi', 'ANALYST', TRUE),
(4, 'auditor_viewer', 'dora.auditor@vulnfollowup.eu', 'Javier Ortega (External DORA Auditor)', '$2b$12$zspv6yZJPCZ8z9MUKtDbs.0ZZAZvL/fybH/xR5Jnv2a2WtCP41pBu', 'VIEWER', TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =============================================================================
-- 2. SEED ICT PROVIDERS (EU DORA Chapter V)
-- is_critical_third_party = TRUE marks CRITICAL_THIRD_PARTY providers.
-- Includes mandatory SGE demo provider #5: "HostingSur S.L." (criticality HIGH,
-- contract review scheduled for March: 2026-03-15)
-- =============================================================================
INSERT INTO ict_providers (id, provider_code, name, provided_service, criticality, is_critical_third_party, contract_reference, contract_status, review_date, contact_email, country_code, sla_availability_pct) VALUES
(1, 'PROV-001', 'CloudScale European Infrastructure S.A.', 'Infraestructura Cloud IaaS y nodos de cómputo bancario',       'CRITICAL', TRUE,  'CTR-DORA-2024-CS01', 'ACTIVE',       '2026-06-15', 'dora-compliance@cloudscale-eu.com',   'ES', 99.99),
(2, 'PROV-002', 'SwiftFin Interbank Connectivity BV',      'Mensajería financiera interbancaria y liquidación SEPA',       'CRITICAL', TRUE,  'CTR-DORA-2024-SF02', 'ACTIVE',       '2026-09-10', 'security-ops@swiftfin-interbank.eu',  'BE', 99.99),
(3, 'PROV-003', 'CyberShield Managed SOC & Edge Networks', 'Gestión perimetral de cortafuegos y SOC 24x7 (MSSP)',          'HIGH',     FALSE, 'CTR-DORA-2024-CS03', 'ACTIVE',       '2026-05-20', 'soc-leads@cybershield-security.de',   'DE', 99.95),
(4, 'PROV-004', 'DevOpsForge Tooling & Identity Solutions Ltd','Plataforma CI/CD corporativa y directorio de identidades',     'MEDIUM',   FALSE, 'CTR-DORA-2024-DF04', 'ACTIVE',       '2026-11-05', 'support@devopsforge-tools.com',       'IE', 99.90),
(5, 'PROV-005', 'HostingSur S.L.',                         'Alojamiento gestionado y pasarela para API de pagos',          'HIGH',     FALSE, 'CTR-DORA-2025-HS05', 'UNDER_REVIEW', '2026-03-15', 'seguridad-dora@hostingsur.es',        'ES', 99.95);

SELECT setval('ict_providers_id_seq', (SELECT MAX(id) FROM ict_providers));

-- =============================================================================
-- 3. SEED TECHNOLOGICAL ASSETS
-- Includes mandatory SGE demo asset #8: "API de pagos" linked to provider_id=5
-- ("HostingSur S.L.") with criticality 'HIGH'
-- =============================================================================
INSERT INTO assets (id, asset_code, name, asset_type, criticality, environment, owner_department, ip_address, operating_system, status, provider_id) VALUES
(1, 'SRV-PROD-CB01',  'Core Banking API Server',          'APPLICATION_SERVER', 'CRITICAL', 'PRODUCTION', 'Arquitectura Core Bancario',         '10.100.4.15',  'Ubuntu 22.04 LTS',                    'ACTIVE', 1),
(2, 'GW-PROD-MOB01',  'Customer Mobile API Gateway',      'API_GATEWAY',        'CRITICAL', 'PRODUCTION', 'Canales Digitales y Banca Móvil',    '10.100.4.20',  'Alpine Linux 3.19',                   'ACTIVE', 1),
(3, 'SRV-SWIFT-01',   'SWIFT Transaction Gateway',        'APPLICATION_SERVER', 'CRITICAL', 'PRODUCTION', 'Tesorería y Pagos Internacionales',  '10.100.8.50',  'Red Hat Enterprise Linux 9.2',        'ACTIVE', 2),
(4, 'SRV-WEB-PORTAL', 'Customer Self-Service Web Portal', 'WEB_SERVER',         'HIGH',     'PRODUCTION', 'Banca Particulares',                 '10.100.12.10', 'Debian 12 Bookworm',                  'ACTIVE', 1),
(5, 'FW-BORDER-A',    'Perimeter Enterprise Firewall',    'NETWORK_DEVICE',     'CRITICAL', 'PRODUCTION', 'Seguridad de Red y Comunicaciones',  '194.224.88.1', 'FortiOS 7.4 / PAN-OS',                'ACTIVE', 3),
(6, 'SRV-BUILD-01',   'CI/CD & DevOps Automation Node',   'BUILD_SERVER',       'MEDIUM',   'STAGING',    'Ingeniería de Plataforma DevSecOps', '10.100.20.100','Ubuntu 24.04 LTS',                    'ACTIVE', 4),
(7, 'DC-CORP-01',     'Central Identity Active Directory','IDENTITY_PROVIDER',  'CRITICAL', 'PRODUCTION', 'IAM y Gobierno de Identidades',      '10.100.2.10',  'Windows Server 2022 Datacenter',      'ACTIVE', 4),
(8, 'AST-PAY-008',    'API de pagos',                     'API_SERVICE',        'HIGH',     'PRODUCTION', 'Medios de Pago y Liquidación',       '10.100.15.80', 'Debian 12 Bookworm (Kubernetes 1.30)','ACTIVE', 5);

SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));

-- =============================================================================
-- 4. SEED VULNERABILITIES (20 synthetic CVEs & internal codes VFU-0001..VFU-0020)
-- resolved_at is set only for RESUELTA / CERRADA (enforced by a CHECK constraint).
-- =============================================================================
INSERT INTO vulnerabilities (
    id, internal_code, cve_id, title, description, status,
    cvss_version, cvss_vector, cvss_score, severity,
    remediation_plan, assigned_to, reported_by, discovered_at, target_remediation_date, resolved_at
) VALUES
(1, 'VFU-0001', 'CVE-2026-90001', 'Insecure deserialization in notification service allows remote code execution',
     'The notification service deserializes untrusted payloads from crafted operator documents without type filtering, allowing an attacker to run arbitrary code once the document is opened.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H', 8.8, 'HIGH',
     'Enable a deserialization allow-list and upgrade the notification module to the patched release.',
     2, 1, '2026-01-12', '2026-01-20', NULL),

(2, 'VFU-0002', 'CVE-2026-90002', 'Unauthenticated command injection in perimeter firewall VPN portal',
     'A command injection flaw in the VPN portal of the perimeter firewall lets an unauthenticated remote attacker execute operating system commands with root privileges.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0, 'CRITICAL',
     'Upgrade the firewall firmware to the fixed release and enable the vendor threat-prevention signature.',
     2, 1, '2026-01-15', '2026-01-18', NULL),

(3, 'VFU-0003', 'CVE-2026-90003', 'Signal handler race condition in SSH daemon enables remote root code execution',
     'A race condition in the signal handler of the SSH daemon allows unauthenticated remote code execution as root on glibc-based Linux systems.',
     'ABIERTA', '4.0', 'CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.2, 'CRITICAL',
     'Update the SSH server package to the fixed version or set LoginGraceTime to 0 as a temporary mitigation.',
     3, 1, '2026-01-18', '2026-02-01', NULL),

(4, 'VFU-0004', 'CVE-2026-90004', 'Rapid stream reset flood causes denial of service in HTTP/2 reverse proxy',
     'The HTTP/2 implementation accepts rapid consecutive stream resets from a client, exhausting worker resources and causing a denial of service.',
     'RESUELTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH',
     'Configure HTTP/2 stream rate-limiting in reverse proxies and patch load balancers.',
     2, 1, '2026-01-20', '2026-02-05', '2026-02-03 14:30:00+01'),

(5, 'VFU-0005', 'CVE-2026-90005', 'Arbitrary file read through argument expansion in CI server command line interface',
     'The command line interface of the CI server expands file references in arguments, allowing unauthenticated attackers to read arbitrary files from the server.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5, 'HIGH',
     'Upgrade the CI server core to the fixed version and disable unauthenticated command line access.',
     3, 1, '2026-01-22', '2026-02-02', '2026-01-29 11:15:00+01'),

(6, 'VFU-0006', 'CVE-2026-90006', 'Authentication bypass in CI server web console grants administrative access',
     'An authentication bypass in the web console of the CI server enables unauthenticated remote attackers to perform administrative actions and achieve code execution.',
     'RESUELTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Apply the vendor security release and rotate build agent tokens.',
     2, 1, '2026-01-25', '2026-01-30', '2026-01-28 17:45:00+01'),

(7, 'VFU-0007', 'CVE-2026-90007', 'Argument injection in legacy report CGI handler allows command execution',
     'The legacy CGI handler of the reporting module passes query string characters to the interpreter without sanitization, allowing remote command execution.',
     'PENDIENTE DE REMEDIACIÓN', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.3, 'CRITICAL',
     'Update the interpreter to the fixed release and migrate legacy CGI handlers to FastCGI.',
     3, 1, '2026-01-28', '2026-02-10', NULL),

(8, 'VFU-0008', 'CVE-2026-90008', 'Heap overflow in directory licensing RPC service allows unauthenticated code execution',
     'A heap-based buffer overflow in the licensing RPC service of the directory server allows unauthenticated network attackers to achieve code execution.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Install the cumulative security update on domain controllers and restrict RPC port exposure.',
     2, 1, '2026-02-01', '2026-02-08', NULL),

(9, 'VFU-0009', 'CVE-2026-90009', 'Heap buffer overflow in image decoding library triggered by crafted upload',
     'A heap buffer overflow in the lossless image decoder allows code execution when a crafted image uploaded by a user is rendered.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H', 8.8, 'HIGH',
     'Update the system image decoding library across web portal nodes.',
     3, 1, '2026-02-03', '2026-02-15', '2026-02-10 09:20:00+01'),

(10, 'VFU-0010', 'CVE-2026-90010', 'Container escape through leaked file descriptor in container runtime',
     'The container runtime leaks an internal host file descriptor when a crafted working directory is specified, allowing a container breakout to the host.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H', 8.6, 'HIGH',
     'Upgrade the container runtime on Kubernetes payment and core nodes to the fixed release.',
     2, 1, '2026-02-05', '2026-02-20', NULL),

(11, 'VFU-0011', 'CVE-2026-90011', 'Backdoor injected into compression library release tarball',
     'Upstream source tarballs of a widely used compression library contained obfuscated backdoor code that altered authentication functions during the build stage.',
     'CERRADA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 10.0, 'CRITICAL',
     'Pin the library to verified clean packages and audit cryptographic checksums.',
     2, 1, '2026-02-07', '2026-02-09', '2026-02-08 19:00:00+01'),

(12, 'VFU-0012', 'CVE-2026-90012', 'Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos',
     'Vulnerabilidad crítica de escritura fuera de límites (Out-of-bounds Write) en el motor TLS/HTTP de la API de pagos alojada por HostingSur S.L., permitiendo ejecución de código arbitrario mediante peticiones HTTP manipuladas sin autenticación previa.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Aplicar parche de emergencia en el cluster de API de pagos de HostingSur S.L., activar reglas WAF de inspección profunda y condicionar la renovación del contrato de marzo a la verificación del parche.',
     2, 1, '2026-02-10', '2026-03-01', NULL),

(13, 'VFU-0013', 'CVE-2026-90013', 'Denial of service in firewall web management engine',
     'A flaw in the web management engine of the firewall allows an unauthenticated remote attacker to reload the device, causing a denial of service.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH',
     'Apply the fixed firewall software release during the scheduled maintenance window.',
     3, 1, '2026-02-11', '2026-02-25', NULL),

(14, 'VFU-0014', 'CVE-2026-90014', 'Heap buffer overflow in proxy client library SOCKS5 handshake',
     'A heap-based buffer overflow in the SOCKS5 proxy handshake of the client library allows remote code execution or a crash when hostnames exceed 255 bytes.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H', 8.1, 'HIGH',
     'Update the client library across all Debian and Ubuntu base images.',
     3, 1, '2026-02-12', '2026-02-22', '2026-02-19 16:10:00+01'),

(15, 'VFU-0015', 'CVE-2026-90015', 'URL parsing flaw in web framework enables open redirect and SSRF',
     'Applications that build URLs from externally provided host information may parse them insecurely in the web framework, enabling open redirects and server-side request forgery.',
     'ABIERTA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N', 5.3, 'MEDIUM',
     'Upgrade the web framework to the fixed version and validate redirect targets against an allow-list.',
     2, 1, '2026-02-14', '2026-03-14', NULL),

(16, 'VFU-0016', 'CVE-2026-90016', 'Memory exhaustion in archive library when processing crafted archives',
     'The archive library allocates resources without limits, so a crafted archive file can cause an out-of-memory error and degrade the service.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L', 5.3, 'MEDIUM',
     'Update the archive library dependency to the fixed release in the Maven build.',
     3, 1, '2026-02-15', '2026-03-15', NULL),

(17, 'VFU-0017', 'CVE-2026-90017', 'Compressed token bomb exhausts server resources in token library',
     'An attacker can send a highly compressed encrypted token that exhausts CPU and memory on the server when it is decompressed.',
     'RESUELTA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N', 6.9, 'MEDIUM',
     'Update the token library and enforce a 256 KB decompression cap on token payloads.',
     2, 1, '2026-02-16', '2026-03-10', '2026-02-24 12:00:00+01'),

(18, 'VFU-0018', 'CVE-2026-90018', 'Inconsistent IPv4-mapped IPv6 parsing allows access control list bypass',
     'IPv4-mapped IPv6 addresses are parsed inconsistently by the address helper functions, which could cause access control list bypasses.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', 5.3, 'MEDIUM',
     'Recompile the affected microservices with the fixed runtime release.',
     3, 1, '2026-02-17', '2026-03-05', '2026-02-25 10:00:00+01'),

(19, 'VFU-0019', 'CVE-2026-90019', 'Integer overflow in legacy archive utility',
     'A legacy archive utility contains an integer overflow that can lead to a limited heap buffer overflow when a large uncompressed file size is supplied.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N', 3.7, 'LOW',
     'Replace the legacy archive routines with standard Java or operating system zip libraries.',
     3, 1, '2026-02-18', '2026-05-01', NULL),

(20, 'VFU-0020', 'CVE-2026-90020', 'Path traversal in static resource handler for authenticated users',
     'Applications serving static resources through custom resource chain resolvers could expose limited internal files to authenticated users.',
     'PENDIENTE DE REMEDIACIÓN', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:P/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N', 2.1, 'LOW',
     'Update the web framework to the fixed release and audit the resource handler configuration.',
     2, 1, '2026-02-19', '2026-05-15', NULL);

SELECT setval('vulnerabilities_id_seq', (SELECT MAX(id) FROM vulnerabilities));

-- =============================================================================
-- 5. SEED N:M VULNERABILITY_ASSETS MAPPING
-- Links VFU-0012 (id=12) directly to "API de pagos" (asset_id=8, HostingSur S.L.)
-- =============================================================================
INSERT INTO vulnerability_assets (vulnerability_id, asset_id, exposure_status, detected_at, notes) VALUES
(1, 1, 'AFFECTED', '2026-01-12 09:00:00+01', 'Notification module exposed on Core Banking server.'),
(1, 4, 'AFFECTED', '2026-01-12 09:00:00+01', 'Notification subsystem affected.'),
(2, 5, 'AFFECTED', '2026-01-15 09:00:00+01', 'Emergency virtual patch applied at border firewall; full firmware upgrade pending.'),
(3, 1, 'AFFECTED', '2026-01-18 09:00:00+01', 'SSH daemon reachable from internal management VLAN.'),
(3, 2, 'AFFECTED', '2026-01-18 09:00:00+01', 'Bastion SSH port requires the fixed package.'),
(3, 3, 'AFFECTED', '2026-01-18 09:00:00+01', 'RHEL backport verification in progress.'),
(4, 2, 'PATCHED', '2026-01-20 09:00:00+01', 'Stream limit applied at the API gateway.'),
(4, 4, 'PATCHED', '2026-01-20 09:00:00+01', 'Load balancer rate-limiting verified.'),
(4, 8, 'PATCHED', '2026-01-20 09:00:00+01', 'Ingress controller patched in HostingSur Kubernetes cluster.'),
(5, 6, 'PATCHED', '2026-01-22 09:00:00+01', 'CI server upgraded and unauthenticated CLI disabled.'),
(6, 6, 'PATCHED', '2026-01-25 09:00:00+01', 'CI server patched and agent tokens rotated.'),
(7, 4, 'AFFECTED', '2026-01-28 09:00:00+01', 'Legacy reporting module migrating to FastCGI.'),
(8, 7, 'AFFECTED', '2026-02-01 09:00:00+01', 'Domain controller scheduled for maintenance window.'),
(9, 4, 'PATCHED', '2026-02-03 09:00:00+01', 'Image library updated across web portal containers.'),
(10, 1, 'AFFECTED', '2026-02-05 09:00:00+01', 'Container runtime upgrade scheduled.'),
(10, 2, 'AFFECTED', '2026-02-05 09:00:00+01', 'Container runtime upgrade scheduled.'),
(10, 8, 'AFFECTED', '2026-02-05 09:00:00+01', 'Kubernetes worker nodes on HostingSur S.L. require the fixed runtime.'),
(11, 1, 'PATCHED', '2026-02-07 09:00:00+01', 'Verified clean package installed.'),
(11, 3, 'PATCHED', '2026-02-07 09:00:00+01', 'Verified clean package installed.'),
(12, 5, 'MITIGATED', '2026-02-10 09:00:00+01', 'Regla de mitigación temporal aplicada en cortafuegos perimetral hacia HostingSur S.L.'),
(12, 8, 'AFFECTED', '2026-02-10 09:00:00+01', 'CASO CRÍTICO DORA: API de pagos (HostingSur S.L.) afectada por VFU-0012 (CVSS 9.8). Proveedor marcado EN RIESGO de cara a la revisión contractual de marzo.'),
(13, 5, 'AFFECTED', '2026-02-11 09:00:00+01', 'Pending firmware maintenance window.'),
(14, 1, 'PATCHED', '2026-02-12 09:00:00+01', 'Client library updated.'),
(14, 2, 'PATCHED', '2026-02-12 09:00:00+01', 'Client library updated.'),
(14, 4, 'PATCHED', '2026-02-12 09:00:00+01', 'Client library updated.'),
(15, 1, 'AFFECTED', '2026-02-14 09:00:00+01', 'URL builder audit queued.'),
(15, 2, 'AFFECTED', '2026-02-14 09:00:00+01', 'URL builder audit queued.'),
(15, 8, 'AFFECTED', '2026-02-14 09:00:00+01', 'Payment callback URL validation under review.'),
(16, 1, 'AFFECTED', '2026-02-15 09:00:00+01', 'Maven dependency bump in progress.'),
(17, 2, 'PATCHED', '2026-02-16 09:00:00+01', 'Token library updated and decompression cap enforced.'),
(18, 3, 'PATCHED', '2026-02-17 09:00:00+01', 'Runtime updated and service recompiled.'),
(19, 6, 'AFFECTED', '2026-02-18 09:00:00+01', 'Low severity; scheduled for Q2 maintenance.'),
(20, 1, 'AFFECTED', '2026-02-19 09:00:00+01', 'Static resource handler review queued.');

-- =============================================================================
-- 6. SEED CVSS_ASSESSMENTS (history of CVSS Base evaluations)
-- Exactly one is_current row per vulnerability (unique partial index).
-- VFU-0003 shows a re-assessment: first scored with v3.1, later re-scored with v4.0.
-- =============================================================================
INSERT INTO cvss_assessments (vulnerability_id, assessed_by, cvss_version, cvss_vector, cvss_score, severity, is_current, assessed_at) VALUES
(1, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H', 8.8, 'HIGH', TRUE, '2026-01-12 09:30:00+01'),
(2, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0, 'CRITICAL', TRUE, '2026-01-15 09:30:00+01'),
(3, 3, '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H', 8.1, 'HIGH', FALSE, '2026-01-18 09:15:00+01'),
(3, 3, '4.0', 'CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.2, 'CRITICAL', TRUE, '2026-01-20 09:30:00+01'),
(4, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH', TRUE, '2026-01-20 09:30:00+01'),
(5, 3, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5, 'HIGH', TRUE, '2026-01-22 09:30:00+01'),
(6, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL', TRUE, '2026-01-25 09:30:00+01'),
(7, 3, '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.3, 'CRITICAL', TRUE, '2026-01-28 09:30:00+01'),
(8, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL', TRUE, '2026-02-01 09:30:00+01'),
(9, 3, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H', 8.8, 'HIGH', TRUE, '2026-02-03 09:30:00+01'),
(10, 2, '3.1', 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H', 8.6, 'HIGH', TRUE, '2026-02-05 09:30:00+01'),
(11, 2, '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 10.0, 'CRITICAL', TRUE, '2026-02-07 09:30:00+01'),
(12, 2, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL', TRUE, '2026-02-10 09:30:00+01'),
(13, 3, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH', TRUE, '2026-02-11 09:30:00+01'),
(14, 3, '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H', 8.1, 'HIGH', TRUE, '2026-02-12 09:30:00+01'),
(15, 2, '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N', 5.3, 'MEDIUM', TRUE, '2026-02-14 09:30:00+01'),
(16, 3, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L', 5.3, 'MEDIUM', TRUE, '2026-02-15 09:30:00+01'),
(17, 2, '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N', 6.9, 'MEDIUM', TRUE, '2026-02-16 09:30:00+01'),
(18, 3, '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', 5.3, 'MEDIUM', TRUE, '2026-02-17 09:30:00+01'),
(19, 3, '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N', 3.7, 'LOW', TRUE, '2026-02-18 09:30:00+01'),
(20, 2, '4.0', 'CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:P/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N', 2.1, 'LOW', TRUE, '2026-02-19 09:30:00+01');

-- =============================================================================
-- 7. SEED REMEDIATION_COMMENTS (Follow-up Technical Notes)
-- =============================================================================
INSERT INTO remediation_comments (vulnerability_id, user_id, comment_text, evidence_url) VALUES
(12, 2, 'Se ha notificado de urgencia al equipo técnico de HostingSur S.L. (seguridad-dora@hostingsur.es) exigiendo el parcheado del activo "API de pagos" antes de la revisión contractual de marzo.', 'https://tickets.vulnfollowup.eu/dora/HS-2026-0012'),
(12, 1, 'CISO: Proveedor HostingSur S.L. marcado automáticamente en estado AT_RISK bajo normativa DORA Capítulo V por mantener VFU-0012 (CVSS 9.8 Crítica) en estado PENDIENTE DE REMEDIACIÓN sobre el activo crítico API de pagos.', 'https://audits.vulnfollowup.eu/dora/report-prov-005'),
(2, 2, 'Firma de prevención activada en FW-BORDER-A; pendiente ventana de reinicio para la actualización completa del firmware.', NULL),
(4, 2, 'Parche de límite de streams HTTP/2 verificado mediante pruebas de carga controladas.', 'https://ci.vulnfollowup.eu/reports/vfu-0004-verify');

-- =============================================================================
-- 8. SEED AUDIT_LOGS (immutable, append-only lifecycle trail)
-- One VULNERABILITY_CREATED row per vulnerability plus one STATUS_TRANSITION row
-- for every step of ABIERTA -> PENDIENTE DE REMEDIACIÓN -> RESUELTA -> CERRADA.
-- The last new_status of each vulnerability equals its current status.
-- =============================================================================
INSERT INTO audit_logs (vulnerability_id, user_id, action_type, previous_status, new_status, justification, created_at) VALUES
(1, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0001 (HIGH, CVSS 8.8) registrada en el inventario de vulnerabilidades.', '2026-01-12 09:00:00+01'),
(2, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0002 (CRITICAL, CVSS 10.0) registrada en el inventario de vulnerabilidades.', '2026-01-15 09:00:00+01'),
(2, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Mitigación perimetral iniciada por equipo de red.', '2026-01-16 10:00:00+01'),
(3, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0003 (CRITICAL, CVSS 9.2) registrada en el inventario de vulnerabilidades.', '2026-01-18 09:00:00+01'),
(4, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0004 (HIGH, CVSS 7.5) registrada en el inventario de vulnerabilidades.', '2026-01-20 09:00:00+01'),
(4, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Escalado a ingeniería de plataforma.', '2026-01-21 10:00:00+01'),
(4, 2, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Configuración de límites HTTP/2 aplicada y verificada en producción.', '2026-02-03 14:30:00+01'),
(5, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0005 (HIGH, CVSS 7.5) registrada en el inventario de vulnerabilidades.', '2026-01-22 09:00:00+01'),
(5, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-02-02.', '2026-01-23 10:00:00+01'),
(5, 3, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-01-29 11:15:00+01'),
(5, 1, 'STATUS_TRANSITION', 'RESUELTA', 'CERRADA', 'Cierre validado por CISO tras deshabilitar el acceso CLI sin autenticar y actualizar la versión.', '2026-01-30 12:00:00+01'),
(6, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0006 (CRITICAL, CVSS 9.8) registrada en el inventario de vulnerabilidades.', '2026-01-25 09:00:00+01'),
(6, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez. Se planifica la remediación con fecha objetivo 2026-01-30.', '2026-01-26 10:00:00+01'),
(6, 2, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-01-28 17:45:00+01'),
(7, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0007 (CRITICAL, CVSS 9.3) registrada en el inventario de vulnerabilidades.', '2026-01-28 09:00:00+01'),
(7, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-02-10.', '2026-01-29 10:00:00+01'),
(8, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0008 (CRITICAL, CVSS 9.8) registrada en el inventario de vulnerabilidades.', '2026-02-01 09:00:00+01'),
(9, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0009 (HIGH, CVSS 8.8) registrada en el inventario de vulnerabilidades.', '2026-02-03 09:00:00+01'),
(9, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-02-15.', '2026-02-04 10:00:00+01'),
(9, 3, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-02-10 09:20:00+01'),
(9, 1, 'STATUS_TRANSITION', 'RESUELTA', 'CERRADA', 'Cierre formal auditado por el equipo de seguridad tras verificar la corrección en producción.', '2026-02-11 12:00:00+01'),
(10, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0010 (HIGH, CVSS 8.6) registrada en el inventario de vulnerabilidades.', '2026-02-05 09:00:00+01'),
(10, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez. Se planifica la remediación con fecha objetivo 2026-02-20.', '2026-02-06 10:00:00+01'),
(11, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0011 (CRITICAL, CVSS 10.0) registrada en el inventario de vulnerabilidades.', '2026-02-07 09:00:00+01'),
(11, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez. Se planifica la remediación con fecha objetivo 2026-02-09.', '2026-02-08 10:00:00+01'),
(11, 2, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-02-08 19:00:00+01'),
(11, 1, 'STATUS_TRANSITION', 'RESUELTA', 'CERRADA', 'Cierre formal auditado por el equipo de seguridad tras verificar la corrección en producción.', '2026-02-09 12:00:00+01'),
(12, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de vulnerabilidad VFU-0012 detectada en auditoría sobre el activo API de pagos (HostingSur S.L.).', '2026-02-10 09:00:00+01'),
(12, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez (ANALYST). Se solicita remediación urgente a HostingSur S.L. previa a la revisión de contrato en marzo.', '2026-02-11 10:00:00+01'),
(13, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0013 (HIGH, CVSS 7.5) registrada en el inventario de vulnerabilidades.', '2026-02-11 09:00:00+01'),
(14, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0014 (HIGH, CVSS 8.1) registrada en el inventario de vulnerabilidades.', '2026-02-12 09:00:00+01'),
(14, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-02-22.', '2026-02-13 10:00:00+01'),
(14, 3, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-02-19 16:10:00+01'),
(14, 1, 'STATUS_TRANSITION', 'RESUELTA', 'CERRADA', 'Cierre formal auditado por el equipo de seguridad tras verificar la corrección en producción.', '2026-02-20 12:00:00+01'),
(15, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0015 (MEDIUM, CVSS 5.3) registrada en el inventario de vulnerabilidades.', '2026-02-14 09:00:00+01'),
(16, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0016 (MEDIUM, CVSS 5.3) registrada en el inventario de vulnerabilidades.', '2026-02-15 09:00:00+01'),
(16, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-03-15.', '2026-02-16 10:00:00+01'),
(17, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0017 (MEDIUM, CVSS 6.9) registrada en el inventario de vulnerabilidades.', '2026-02-16 09:00:00+01'),
(17, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez. Se planifica la remediación con fecha objetivo 2026-03-10.', '2026-02-17 10:00:00+01'),
(17, 2, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-02-24 12:00:00+01'),
(18, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0018 (MEDIUM, CVSS 5.3) registrada en el inventario de vulnerabilidades.', '2026-02-17 09:00:00+01'),
(18, 3, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Laura Gómez. Se planifica la remediación con fecha objetivo 2026-03-05.', '2026-02-18 10:00:00+01'),
(18, 3, 'STATUS_TRANSITION', 'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Parche o control compensatorio aplicado y validado en el entorno de pruebas.', '2026-02-25 10:00:00+01'),
(18, 1, 'STATUS_TRANSITION', 'RESUELTA', 'CERRADA', 'Cierre formal auditado por el equipo de seguridad tras verificar la corrección en producción.', '2026-02-26 12:00:00+01'),
(19, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0019 (LOW, CVSS 3.7) registrada en el inventario de vulnerabilidades.', '2026-02-18 09:00:00+01'),
(20, 1, 'VULNERABILITY_CREATED', NULL, 'ABIERTA', 'Alta inicial de VFU-0020 (LOW, CVSS 2.1) registrada en el inventario de vulnerabilidades.', '2026-02-19 09:00:00+01'),
(20, 2, 'STATUS_TRANSITION', 'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez. Se planifica la remediación con fecha objetivo 2026-05-15.', '2026-02-20 10:00:00+01');

COMMIT;
