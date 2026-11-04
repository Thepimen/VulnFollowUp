-- =============================================================================
-- VulnFollowUp — Realistic Seed Data & Official SGE Demo Case (PostgreSQL 15+)
-- File: database/seed/02_seed_data.sql
-- Includes:
--   • 4 Demo Users (ADMIN, ANALYST, VIEWER) with BCrypt ($2b$12$) hashes + salts
--   • 5 ICT Providers under EU DORA (including mandatory "HostingSur S.L.")
--   • 8 Technological Assets (including mandatory "API de pagos" -> HostingSur)
--   • 20 Realistic CVE/VFU Vulnerabilities (including mandatory "VFU-0012"
--     with CVSS 9.8 CRITICAL in state "PENDIENTE DE REMEDIACIÓN" affecting
--     "API de pagos" of "HostingSur S.L.")
--   • N:M mappings (vulnerability_assets), CVSS history (cvss_assessments),
--     follow-up notes (remediation_comments), and immutable audit_logs
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. SEED USERS (Roles: ADMIN, ANALYST, VIEWER)
-- Demo Passwords (never stored in plaintext; hashed with BCrypt cost=12 + salt):
--   • admin_dora     -> AdminDora#2026!
--   • analyst_soc    -> AnalystSoc#2026!
--   • analyst_appsec -> AnalystApp#2026!
--   • auditor_viewer -> ViewerDora#2026!
-- =============================================================================
INSERT INTO users (id, username, email, full_name, password_hash, password_salt, role, is_active) VALUES
(1, 'admin_dora',     'ciso.admin@vulnfollowup.eu',     'Elena Vázquez (CISO / DORA Lead)',     '$2b$12$K8p9mR2vL5qW3xZ7nB1cDeF4gH6jK8lM0nP2qR4sT6uV8wX0yZ2aB', 'f8a9c2d1e4b70391a6c5d8e2f1b4a7c9', 'ADMIN',   TRUE),
(2, 'analyst_soc',    'carlos.mendez@vulnfollowup.eu',  'Carlos Méndez (Senior SOC Analyst)',   '$2b$12$M3n7pQ9rT1vW5xY8zA2bCeD6fG8hJ0kL2mN4pQ6rS8tU0vW2xY4zA', 'a1b2c3d4e5f60718293a4b5c6d7e8f90', 'ANALYST', TRUE),
(3, 'analyst_appsec', 'laura.gomez@vulnfollowup.eu',    'Laura Gómez (AppSec Engineer)',        '$2b$12$P5q8rS1tU3vW7xY9zB4cDeF8gH0jK2lM4nP6qR8sT0uV2wX4yZ6aB', '9f8e7d6c5b4a39281726354453627180', 'ANALYST', TRUE),
(4, 'auditor_viewer', 'dora.auditor@vulnfollowup.eu',   'Javier Ortega (External DORA Auditor)','$2b$12$R7s0tU3vW5xY9zA1bC6dEeF0gH2jK4lM6nP8qR0sT2uV4wX6yZ8aB', '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f', 'VIEWER',  TRUE);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =============================================================================
-- 2. SEED ICT PROVIDERS (EU DORA Chapter V)
-- Includes mandatory SGE demo provider #5: "HostingSur S.L." (Criticality HIGH,
-- contract review scheduled for March: 2026-03-15)
-- =============================================================================
INSERT INTO ict_providers (id, provider_code, name, provided_service, criticality, contract_reference, contract_status, review_date, contact_email, country_code, sla_availability_pct) VALUES
(1, 'PROV-001', 'CloudScale European Infrastructure S.A.', 'Infraestructura Cloud IaaS y nodos de cómputo bancario',       'CRITICAL', 'CTR-DORA-2024-CS01', 'ACTIVE',       '2026-06-15', 'dora-compliance@cloudscale-eu.com',   'ES', 99.99),
(2, 'PROV-002', 'SwiftFin Interbank Connectivity BV',      'Mensajería financiera interbancaria y liquidación SEPA',       'CRITICAL', 'CTR-DORA-2024-SF02', 'ACTIVE',       '2026-09-10', 'security-ops@swiftfin-interbank.eu',  'BE', 99.99),
(3, 'PROV-003', 'CyberShield Managed SOC & Edge Networks', 'Gestión perimetral de cortafuegos y SOC 24x7 (MSSP)',          'HIGH',     'CTR-DORA-2024-CS03', 'ACTIVE',       '2026-05-20', 'soc-leads@cybershield-security.de',   'DE', 99.95),
(4, 'PROV-004', 'DevOpsForge Tooling & Identity Solutions','Plataforma CI/CD corporativa y directorio de identidades',     'MEDIUM',   'CTR-DORA-2024-DF04', 'ACTIVE',       '2026-11-05', 'support@devopsforge-tools.com',       'IE', 99.90),
(5, 'PROV-005', 'HostingSur S.L.',                         'Alojamiento gestionado y pasarela para API de pagos',          'HIGH',     'CTR-DORA-2025-HS05', 'UNDER_REVIEW', '2026-03-15', 'seguridad-dora@hostingsur.es',        'ES', 99.95);

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
-- 4. SEED VULNERABILITIES (20 Realistic CVEs & Internal Codes VFU-0001..VFU-0020)
-- Includes mandatory case VFU-0012 (CVSS 9.8, CRITICAL, PENDIENTE DE REMEDIACIÓN)
-- affecting "API de pagos" (asset_id=8) provided by "HostingSur S.L." (provider_id=5)
-- =============================================================================
INSERT INTO vulnerabilities (
    id, internal_code, cve_id, title, description, status,
    cvss_version, cvss_vector, cvss_score, severity,
    remediation_plan, assigned_to, reported_by, discovered_at, target_remediation_date, resolved_at
) VALUES
(1,  'VFU-0001', 'CVE-2024-21413', 'Microsoft Outlook Remote Code Execution Vulnerability (Moniker Link)',
     'An attacker could bypass Office Protected View and execute arbitrary code via a specially crafted mail containing a malicious moniker link.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Deploy Microsoft security bulletin KB5035349 to all workstation and mail relay endpoints.',
     2, 1, '2026-01-12', '2026-01-20', NULL),

(2,  'VFU-0002', 'CVE-2024-3400', 'Palo Alto Networks PAN-OS Command Injection in GlobalProtect Gateway',
     'A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software allows an unauthenticated attacker to execute arbitrary code with root privileges.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0, 'CRITICAL',
     'Upgrade PAN-OS to 11.1.2-h3 and apply threat prevention signature 95187.',
     2, 1, '2026-01-15', '2026-01-18', NULL),

(3,  'VFU-0003', 'CVE-2024-6387', 'OpenSSH regreSSHion Signal Handler Race Condition Remote Code Execution',
     'A signal handler race condition in OpenSSH server (sshd) allows unauthenticated remote code execution as root on glibc-based Linux systems.',
     'ABIERTA', '4.0', 'CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 8.1, 'HIGH',
     'Update openssh-server to version 9.8p1 or set LoginGraceTime to 0 in sshd_config.',
     3, 1, '2026-01-18', '2026-02-01', NULL),

(4,  'VFU-0004', 'CVE-2023-44487', 'HTTP/2 Rapid Reset Denial of Service Vulnerability',
     'The HTTP/2 protocol allows a client to reset rapid consecutive streams using RST_STREAM frames, overwhelming web servers and causing severe DoS.',
     'RESUELTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH',
     'Configure HTTP/2 stream rate-limiting in reverse proxies and patch load balancers.',
     2, 1, '2026-01-20', '2026-02-05', '2026-02-03 14:30:00+01'),

(5,  'VFU-0005', 'CVE-2024-23897', 'Jenkins CLI Arbitrary File Read Vulnerability',
     'Jenkins uses args4j parser in CLI commands which replaces @ followed by a file path with file contents, allowing unauthenticated attackers to read arbitrary server files.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 7.5, 'HIGH',
     'Upgrade Jenkins core to 2.442 and disable unauthenticated Jenkins CLI access.',
     3, 1, '2026-01-22', '2026-02-02', '2026-01-29 11:15:00+01'),

(6,  'VFU-0006', 'CVE-2024-27198', 'JetBrains TeamCity Authentication Bypass Vulnerability',
     'An authentication bypass in TeamCity web server enables unauthenticated remote attackers to perform administrative actions and achieve RCE.',
     'RESUELTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Apply JetBrains security release 2023.11.4 and rotate build agent tokens.',
     2, 1, '2026-01-25', '2026-01-30', '2026-01-28 17:45:00+01'),

(7,  'VFU-0007', 'CVE-2024-4577', 'PHP CGI Argument Injection Vulnerability on Windows',
     'Bypass of Best Fit encoding mapping in Windows-based PHP installations allows remote command execution via query string character injection.',
     'PENDIENTE DE REMEDIACIÓN', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 9.8, 'CRITICAL',
     'Update PHP to 8.3.8 and migrate legacy CGI handlers to FastCGI.',
     3, 1, '2026-01-28', '2026-02-10', NULL),

(8,  'VFU-0008', 'CVE-2024-38077', 'Windows Remote Desktop Licensing Service Remote Code Execution',
     'Heap-based buffer overflow in the Windows Remote Desktop Licensing Service allows unauthenticated network attackers to achieve code execution.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Install Microsoft cumulative security update on domain controllers and restrict RPC port exposure.',
     2, 1, '2026-02-01', '2026-02-08', NULL),

(9,  'VFU-0009', 'CVE-2023-4863', 'libwebp Heap Buffer Overflow in Image Decoding Pipeline',
     'Heap buffer overflow in WebP lossless encoding decoding allows code execution upon rendering crafted image uploads.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H', 8.8, 'HIGH',
     'Update system libwebp packages to >= 1.3.2 across web portal nodes.',
     3, 1, '2026-02-03', '2026-02-15', '2026-02-10 09:20:00+01'),

(10, 'VFU-0010', 'CVE-2024-21626', 'runc Container Escape via File Descriptor Leak (Leaky Vessels)',
     'In runc through 1.1.11, an attacker can specify a working directory that leaks an internal host file descriptor leading to container breakout.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H', 8.6, 'HIGH',
     'Upgrade container runtime engines to runc 1.1.12+ on Kubernetes payment and core nodes.',
     2, 1, '2026-02-05', '2026-02-20', NULL),

(11, 'VFU-0011', 'CVE-2024-3094', 'XZ Utils Malicious Backdoor Injection in liblzma',
     'Upstream source tarballs of XZ Utils contained obfuscated backdoor code modifying OpenSSH authentication functions in build stages.',
     'CERRADA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 10.0, 'CRITICAL',
     'Pin xz-utils to verified 5.4.x packages and audit cryptographic checksums.',
     2, 1, '2026-02-07', '2026-02-09', '2026-02-08 19:00:00+01'),

(12, 'VFU-0012', 'CVE-2024-21762', 'Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos',
     'Vulnerabilidad crítica de escritura fuera de límites (Out-of-bounds Write) en el motor TLS/HTTP de la API de pagos alojada por HostingSur S.L., permitiendo ejecución de código arbitrario mediante peticiones HTTP manipuladas sin autenticación previa.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8, 'CRITICAL',
     'Aplicar parche de emergencia en el cluster de API de pagos de HostingSur S.L., activar reglas WAF de inspección profunda y condicionar la renovación del contrato de marzo a la verificación del parche.',
     2, 1, '2026-02-10', '2026-03-01', NULL),

(13, 'VFU-0013', 'CVE-2024-20353', 'Cisco Adaptive Security Appliance Denial of Service Vulnerability',
     'A vulnerability in the web server management engine of Cisco ASA software allows an unauthenticated remote attacker to reload the device causing DoS.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5, 'HIGH',
     'Apply Cisco ASA Software release 9.18.4.22 during scheduled maintenance window.',
     3, 1, '2026-02-11', '2026-02-25', NULL),

(14, 'VFU-0014', 'CVE-2023-38545', 'cURL SOCKS5 Heap Buffer Overflow',
     'A heap-based buffer overflow in the SOCKS5 proxy handshake protocol in curl allows remote code execution or crash when hostnames exceed 255 bytes.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H', 8.1, 'HIGH',
     'Update curl and libcurl to 8.4.0 across all Debian/Ubuntu base images.',
     3, 1, '2026-02-12', '2026-02-22', '2026-02-19 16:10:00+01'),

(15, 'VFU-0015', 'CVE-2024-22243', 'Spring Framework URL Parsing Open Redirect and SSRF',
     'Applications using UriComponentsBuilder in Spring Framework may parse externally provided host information insecurely, enabling SSRF attacks.',
     'ABIERTA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N', 5.1, 'MEDIUM',
     'Upgrade spring-web to 6.1.4 and validate redirect targets against an allowlist.',
     2, 1, '2026-02-14', '2026-03-14', NULL),

(16, 'VFU-0016', 'CVE-2024-26308', 'Apache Commons Compress Denial of Service via Pack200',
     'Allocation of Resources Without Limits in Apache Commons Compress allows an attacker to cause an OutOfMemoryError using crafted pack200 archive files.',
     'PENDIENTE DE REMEDIACIÓN', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L', 5.3, 'MEDIUM',
     'Update org.apache.commons:commons-compress dependency to 1.26.0 in Maven pom.xml.',
     3, 1, '2026-02-15', '2026-03-15', NULL),

(17, 'VFU-0017', 'CVE-2024-28180', 'go-jose Malicious JWE Compression Denial of Service (Token Zip Bomb)',
     'An attacker can send a high-compression JSON Web Encryption token that exhausts server CPU/memory upon decompression.',
     'RESUELTA', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N', 5.3, 'MEDIUM',
     'Update go-jose module to v3.0.3 and enforce 256KB JWE payload decompression cap.',
     2, 1, '2026-02-16', '2026-03-10', '2026-02-24 12:00:00+01'),

(18, 'VFU-0018', 'CVE-2024-24790', 'Golang net/netip Unexpected IPv4-Mapped IPv6 Address Parsing Inconsistency',
     'IPv4-mapped IPv6 addresses were parsed inconsistently in IsPrivate/IsLoopback checks, which could cause ACL bypasses.',
     'CERRADA', '3.1', 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N', 5.3, 'MEDIUM',
     'Recompile Go microservices with Go runtime 1.22.4.',
     3, 1, '2026-02-17', '2026-03-05', '2026-02-25 10:00:00+01'),

(19, 'VFU-0019', 'CVE-2023-45853', 'MiniZip Integer Overflow in zlib Contrib Directory',
     'MiniZip in zlib contains an integer overflow and resultant heap buffer overflow through a large uncompressed file size parameter.',
     'ABIERTA', '3.1', 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N', 3.7, 'LOW',
     'Replace legacy minizip archive routines with standard Java/OS zip libraries.',
     3, 1, '2026-02-18', '2026-05-01', NULL),

(20, 'VFU-0020', 'CVE-2024-38816', 'Spring Framework Path Traversal via Static Resource Handlers',
     'Applications serving static resources through Spring WebMvc could expose internal files if configured with custom resource chain resolvers.',
     'PENDIENTE DE REMEDIACIÓN', '4.0', 'CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N', 2.6, 'LOW',
     'Update Spring Framework to 6.1.13 and audit WebMvcConfigurer resource handlers.',
     2, 1, '2026-02-19', '2026-05-15', NULL);

SELECT setval('vulnerabilities_id_seq', (SELECT MAX(id) FROM vulnerabilities));

-- =============================================================================
-- 5. SEED N:M VULNERABILITY_ASSETS MAPPING
-- Links VFU-0012 (id=12) directly to "API de pagos" (asset_id=8, HostingSur S.L.)
-- =============================================================================
INSERT INTO vulnerability_assets (vulnerability_id, asset_id, exposure_status, notes) VALUES
(1,  1, 'AFFECTED',  'Mail relay integration exposed on Core Banking server.'),
(1,  4, 'AFFECTED',  'Notification subsystem affected.'),
(2,  5, 'AFFECTED',  'Emergency virtual patch applied at border firewall; full firmware upgrade pending.'),
(3,  1, 'AFFECTED',  'OpenSSH daemon reachable from internal management VLAN.'),
(3,  2, 'AFFECTED',  'Bastion SSH port requires sshd 9.8p1 update.'),
(3,  3, 'AFFECTED',  'RHEL backport verification in progress.'),
(4,  2, 'PATCHED',   'Nginx HTTP/2 stream limit applied.'),
(4,  4, 'PATCHED',   'Load balancer rate-limiting verified.'),
(4,  8, 'PATCHED',   'Ingress controller patched in HostingSur Kubernetes cluster.'),
(5,  6, 'PATCHED',   'Jenkins upgraded and CLI disabled.'),
(6,  6, 'PATCHED',   'TeamCity patched to 2023.11.4.'),
(7,  4, 'AFFECTED',  'Legacy reporting module migrating to FastCGI.'),
(8,  7, 'AFFECTED',  'Domain controller scheduled for maintenance window.'),
(9,  4, 'PATCHED',   'libwebp updated across web portal containers.'),
(10, 1, 'AFFECTED',  'runc runtime upgrade scheduled.'),
(10, 2, 'AFFECTED',  'runc runtime upgrade scheduled.'),
(10, 8, 'AFFECTED',  'Kubernetes worker nodes on HostingSur S.L. require runc 1.1.12+.'),
(11, 1, 'PATCHED',   'Verified clean xz-utils 5.4.x package.'),
(11, 3, 'PATCHED',   'Verified clean xz-utils 5.4.x package.'),
(12, 8, 'AFFECTED',  'CASO CRÍTICO DORA: API de pagos (HostingSur S.L.) afectada por VFU-0012 (CVSS 9.8). Proveedor marcado EN RIESGO de cara a la revisión contractual de marzo.'),
(12, 5, 'MITIGATED', 'Regla de mitigación temporal aplicada en cortafuegos perimetral hacia HostingSur S.L.'),
(13, 5, 'AFFECTED',  'Pending firmware maintenance window.'),
(14, 1, 'PATCHED',   'libcurl updated to 8.4.0.'),
(14, 2, 'PATCHED',   'libcurl updated to 8.4.0.'),
(14, 4, 'PATCHED',   'libcurl updated to 8.4.0.'),
(15, 1, 'AFFECTED',  'Spring UriComponentsBuilder audit queued.'),
(15, 2, 'AFFECTED',  'Spring UriComponentsBuilder audit queued.'),
(15, 8, 'AFFECTED',  'Payment callback URL validation under review.'),
(16, 1, 'AFFECTED',  'Maven dependency bump in progress.'),
(17, 2, 'PATCHED',   'go-jose updated to v3.0.3.'),
(18, 3, 'PATCHED',   'Go runtime updated to 1.22.4.'),
(19, 7, 'AFFECTED',  'Low severity; scheduled for Q2 maintenance.'),
(20, 1, 'AFFECTED',  'Spring static resource handler review queued.');

-- =============================================================================
-- 6. SEED CVSS_ASSESSMENTS (Historical 3NF CVSS Base Evaluations)
-- =============================================================================
INSERT INTO cvss_assessments (vulnerability_id, assessed_by, cvss_version, cvss_vector, cvss_score, severity, is_current)
SELECT id, assigned_to, cvss_version, cvss_vector, cvss_score, severity, TRUE
FROM vulnerabilities;

-- =============================================================================
-- 7. SEED REMEDIATION_COMMENTS (Follow-up Technical Notes)
-- =============================================================================
INSERT INTO remediation_comments (vulnerability_id, user_id, comment_text, evidence_url) VALUES
(12, 2, 'Se ha notificado de urgencia al equipo técnico de HostingSur S.L. (seguridad-dora@hostingsur.es) exigiendo el parcheado del activo "API de pagos" antes de la revisión contractual de marzo.', 'https://tickets.vulnfollowup.eu/dora/HS-2026-0012'),
(12, 1, 'CISO: Proveedor HostingSur S.L. marcado automáticamente en estado AT_RISK bajo normativa DORA Capítulo V por mantener VFU-0012 (CVSS 9.8 Crítica) en estado PENDIENTE DE REMEDIACIÓN sobre el activo crítico API de pagos.', 'https://audits.vulnfollowup.eu/dora/report-prov-005'),
(2,  2, 'Firma de prevención 95187 activada en FW-BORDER-A; pendiente ventana de reinicio para actualización completa de PAN-OS.', NULL),
(4,  2, 'Parche de límite de streams HTTP/2 verificado mediante pruebas de carga controladas.', 'https://ci.vulnfollowup.eu/reports/vfu-0004-verify');

-- =============================================================================
-- 8. SEED AUDIT_LOGS (Immutable Lifecycle State Transitions)
-- =============================================================================
INSERT INTO audit_logs (vulnerability_id, user_id, action_type, previous_status, new_status, justification) VALUES
(12, 1, 'VULNERABILITY_CREATED', NULL,      'ABIERTA',                  'Alta inicial de vulnerabilidad VFU-0012 detectada en auditoría sobre el activo API de pagos (HostingSur S.L.).'),
(12, 2, 'STATUS_TRANSITION',     'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Asignada a Carlos Méndez (ANALYST). Se solicita remediación urgente a HostingSur S.L. previa a la revisión de contrato en marzo.'),
(2,  2, 'STATUS_TRANSITION',     'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Mitigación perimetral iniciada por equipo de red.'),
(4,  2, 'STATUS_TRANSITION',     'ABIERTA', 'PENDIENTE DE REMEDIACIÓN', 'Escalado a ingeniería de plataforma.'),
(4,  2, 'STATUS_TRANSITION',     'PENDIENTE DE REMEDIACIÓN', 'RESUELTA', 'Configuración de límites HTTP/2 aplicada y verificada en producción.'),
(5,  3, 'STATUS_TRANSITION',     'RESUELTA','CERRADA',                  'Cierre validado por CISO tras deshabilitar Jenkins CLI y actualizar versión.');

COMMIT;
