import type {
  AssetCreateRequest,
  AssetDTO,
  AssetFilterParams,
  AuditLogDTO,
  BatchImportResultDTO,
  CvssAssessmentCreateRequest,
  CvssAssessmentDTO,
  CvssSeverity,
  CvssVersion,
  DashboardSummaryResponse,
  IctProviderDTO,
  IctProviderUpsertRequest,
  PaginatedResponse,
  ProviderDoraReportDTO,
  ProviderFilterParams,
  ReportExportParams,
  StatusTransitionRequest,
  UserRole,
  UserSummaryDTO,
  VulnerabilityCreateRequest,
  VulnerabilityDetailDTO,
  VulnerabilityFilterParams,
  VulnerabilityStatus,
  VulnerabilitySummaryDTO,
} from '../types/api';
import { validateCvssAssessment } from '../utils/cvssValidator';
import { getAllowedTransitions } from '../utils/lifecycle';

export const OFFICIAL_ROLLBACK_TEST_BATCH_JSON = JSON.stringify(
  [
    {
      internal_code: 'VFU-0091',
      cve_id: 'CVE-2026-90091',
      title: 'Valid Batch Item 1 — Database driver prepared statement parsing issue',
      description:
        'Valid record at start of batch import to test transactional atomicity. Should be rolled back when record #4 fails.',
      cvss_version: '3.1',
      cvss_vector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:N',
      cvss_score: 6.8,
      severity: 'MEDIUM',
      status: 'ABIERTA',
      assigned_to: 2,
      discovered_at: '2026-02-20',
      target_remediation_date: '2026-03-20',
      remediation_plan: 'Upgrade the database driver dependency to the fixed release.',
      affected_asset_ids: [1],
    },
    {
      internal_code: 'VFU-0092',
      cve_id: 'CVE-2026-90092',
      title: 'Valid Batch Item 2 — Ingress controller QUIC frame memory disclosure',
      description:
        'Second valid record in transactional batch. Must NOT remain in database after rollback.',
      cvss_version: '4.0',
      cvss_vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:L/SC:N/SI:N/SA:N',
      cvss_score: 6.9,
      severity: 'MEDIUM',
      status: 'ABIERTA',
      assigned_to: 3,
      discovered_at: '2026-02-20',
      target_remediation_date: '2026-03-25',
      remediation_plan: 'Upgrade the ingress controller to the fixed release.',
      affected_asset_ids: [2, 8],
    },
    {
      internal_code: 'VFU-0093',
      cve_id: 'CVE-2026-90093',
      title: 'Valid Batch Item 3 — Kernel packet filter privilege escalation',
      description:
        'Third valid record in transactional batch. Must NOT remain in database after rollback.',
      cvss_version: '3.1',
      cvss_vector: 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H',
      cvss_score: 7.8,
      severity: 'HIGH',
      status: 'PENDIENTE DE REMEDIACIÓN',
      assigned_to: 2,
      discovered_at: '2026-02-20',
      target_remediation_date: '2026-03-05',
      remediation_plan: 'Apply live kernel patch to production nodes.',
      affected_asset_ids: [1, 8],
    },
    {
      internal_code: 'VFU-0094',
      cve_id: 'CVE-2026-90094',
      title: 'CORRUPT RECORD 1 — CVSS Version 4.0 Paired with CVSS 3.1 Vector String',
      description:
        "Intentional constraint violation: declares cvss_version '4.0' while supplying a 'CVSS:3.1/...' vector string.",
      cvss_version: '4.0',
      cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      cvss_score: 9.8,
      severity: 'CRITICAL',
      status: 'ABIERTA',
      assigned_to: 2,
      discovered_at: '2026-02-20',
      target_remediation_date: '2026-03-01',
      remediation_plan: 'Must trigger immediate CVSS validation error and full ROLLBACK.',
      affected_asset_ids: [8],
    },
  ],
  null,
  2
);

export const VALID_SAMPLE_BATCH_JSON = JSON.stringify(
  [
    {
      internal_code: 'VFU-0101',
      cve_id: 'CVE-2026-10101',
      title: 'TLS 1.2 Weak Cipher Suite Negotiation on Payment Edge Proxy',
      description:
        'Edge TLS terminator still permits legacy CBC cipher suites that should be disabled under DORA cryptographic hardening guidelines.',
      cvss_version: '4.0',
      cvss_vector: 'CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N',
      cvss_score: 5.9,
      severity: 'MEDIUM',
      status: 'ABIERTA',
      assigned_to: 2,
      discovered_at: '2026-02-22',
      target_remediation_date: '2026-03-25',
      remediation_plan: 'Enforce TLS 1.3 and AEAD-only cipher suites across ingress nodes.',
      affected_asset_ids: [8],
    },
    {
      internal_code: 'VFU-0102',
      cve_id: 'CVE-2026-10102',
      title: 'JWT Clock Skew Verification Window Too Permissive in Core Gateway',
      description:
        'Excessive clock skew tolerance extends effective token reuse window beyond organizational security policy.',
      cvss_version: '3.1',
      cvss_vector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N',
      cvss_score: 3.7,
      severity: 'LOW',
      status: 'ABIERTA',
      assigned_to: 3,
      discovered_at: '2026-02-22',
      target_remediation_date: '2026-04-15',
      remediation_plan: 'Tighten JWT leeway parameter to 30 seconds and synchronize NTP.',
      affected_asset_ids: [1, 2],
    },
  ],
  null,
  2
);

export const DEMO_USERS: Record<UserRole, UserSummaryDTO> = {
  ADMIN: {
    id: 1,
    username: 'admin_dora',
    email: 'admin.dora@vulnfollowup.eu',
    fullName: 'Elena Martínez (CISO / DORA Admin)',
    role: 'ADMIN',
  },
  ANALYST: {
    id: 2,
    username: 'analyst_soc',
    email: 'analyst.soc@vulnfollowup.eu',
    fullName: 'Carlos Ruiz (Senior SOC Analyst)',
    role: 'ANALYST',
  },
  VIEWER: {
    id: 4,
    username: 'auditor_viewer',
    email: 'auditor.dora@vulnfollowup.eu',
    fullName: 'Lucía Serrano (Auditora DORA)',
    role: 'VIEWER',
  },
};

export const INITIAL_DEMO_PROVIDERS: IctProviderDTO[] = [
  {
    id: 5,
    providerCode: 'PROV-005',
    name: 'HostingSur S.L.',
    providedService: 'Alojamiento gestionado y pasarela para API de pagos',
    criticality: 'HIGH',
    contractReference: 'CTR-DORA-2025-HS05',
    contractStatus: 'UNDER_REVIEW',
    reviewDate: '2026-03-15',
    contactEmail: 'seguridad-dora@hostingsur.es',
    countryCode: 'ES',
    slaAvailabilityPct: 99.95,
    managedAssetsCount: 1,
    activeCriticalHighVulnsCount: 2,
    doraRiskStatus: 'AT_RISK',
  },
  {
    id: 1,
    providerCode: 'PROV-001',
    name: 'CloudScale European Infrastructure S.A.',
    providedService: 'Infraestructura Cloud IaaS y nodos de cómputo bancario',
    criticality: 'CRITICAL',
    contractReference: 'CTR-DORA-2024-CS01',
    contractStatus: 'ACTIVE',
    reviewDate: '2026-06-15',
    contactEmail: 'dora-compliance@cloudscale-eu.com',
    countryCode: 'ES',
    slaAvailabilityPct: 99.99,
    managedAssetsCount: 3,
    activeCriticalHighVulnsCount: 3,
    doraRiskStatus: 'AT_RISK',
  },
  {
    id: 3,
    providerCode: 'PROV-003',
    name: 'CyberShield Managed SOC & Edge Networks',
    providedService: 'Gestión perimetral de cortafuegos y SOC 24x7 (MSSP)',
    criticality: 'HIGH',
    contractReference: 'CTR-DORA-2024-CS03',
    contractStatus: 'ACTIVE',
    reviewDate: '2026-05-20',
    contactEmail: 'soc-leads@cybershield-security.de',
    countryCode: 'DE',
    slaAvailabilityPct: 99.95,
    managedAssetsCount: 1,
    activeCriticalHighVulnsCount: 1,
    doraRiskStatus: 'AT_RISK',
  },
  {
    id: 2,
    providerCode: 'PROV-002',
    name: 'SwiftFin Interbank Connectivity BV',
    providedService: 'Mensajería financiera interbancaria y liquidación SEPA',
    criticality: 'CRITICAL',
    contractReference: 'CTR-DORA-2024-SF02',
    contractStatus: 'ACTIVE',
    reviewDate: '2026-09-10',
    contactEmail: 'security-ops@swiftfin-interbank.eu',
    countryCode: 'BE',
    slaAvailabilityPct: 99.99,
    managedAssetsCount: 1,
    activeCriticalHighVulnsCount: 0,
    doraRiskStatus: 'COMPLIANT',
  },
  {
    id: 4,
    providerCode: 'PROV-004',
    name: 'DevOpsForge Tooling & Identity Solutions',
    providedService: 'Plataforma CI/CD corporativa y directorio de identidades',
    criticality: 'MEDIUM',
    contractReference: 'CTR-DORA-2024-DF04',
    contractStatus: 'ACTIVE',
    reviewDate: '2026-11-05',
    contactEmail: 'support@devopsforge-tools.com',
    countryCode: 'IE',
    slaAvailabilityPct: 99.9,
    managedAssetsCount: 2,
    activeCriticalHighVulnsCount: 0,
    doraRiskStatus: 'COMPLIANT',
  },
];

export const INITIAL_DEMO_ASSETS: AssetDTO[] = [
  {
    id: 8,
    assetCode: 'AST-PAY-008',
    name: 'API de pagos',
    assetType: 'API_SERVICE',
    criticality: 'HIGH',
    environment: 'PRODUCTION',
    ownerDepartment: 'Medios de Pago y Liquidación',
    ipAddress: '10.100.15.80',
    operatingSystem: 'Debian 12 Bookworm (Kubernetes 1.30)',
    status: 'ACTIVE',
    providerId: 5,
    providerName: 'HostingSur S.L.',
    openVulnerabilitiesCount: 3,
  },
  {
    id: 1,
    assetCode: 'SRV-PROD-CB01',
    name: 'Core Banking API Server',
    assetType: 'APPLICATION_SERVER',
    criticality: 'CRITICAL',
    environment: 'PRODUCTION',
    ownerDepartment: 'Arquitectura Core Bancario',
    ipAddress: '10.100.4.15',
    operatingSystem: 'Ubuntu 22.04 LTS',
    status: 'ACTIVE',
    providerId: 1,
    providerName: 'CloudScale European Infrastructure S.A.',
    openVulnerabilitiesCount: 5,
  },
  {
    id: 2,
    assetCode: 'GW-PROD-MOB01',
    name: 'Customer Mobile API Gateway',
    assetType: 'API_GATEWAY',
    criticality: 'CRITICAL',
    environment: 'PRODUCTION',
    ownerDepartment: 'Canales Digitales y Banca Móvil',
    ipAddress: '10.100.4.20',
    operatingSystem: 'Alpine Linux 3.19',
    status: 'ACTIVE',
    providerId: 1,
    providerName: 'CloudScale European Infrastructure S.A.',
    openVulnerabilitiesCount: 3,
  },
  {
    id: 5,
    assetCode: 'FW-BORDER-A',
    name: 'Perimeter Enterprise Firewall',
    assetType: 'NETWORK_DEVICE',
    criticality: 'CRITICAL',
    environment: 'PRODUCTION',
    ownerDepartment: 'Seguridad de Red y Comunicaciones',
    ipAddress: '194.224.88.1',
    operatingSystem: 'FortiOS 7.4 / PAN-OS',
    status: 'ACTIVE',
    providerId: 3,
    providerName: 'CyberShield Managed SOC & Edge Networks',
    openVulnerabilitiesCount: 2,
  },
  {
    id: 4,
    assetCode: 'SRV-WEB-PORTAL',
    name: 'Customer Self-Service Web Portal',
    assetType: 'WEB_SERVER',
    criticality: 'HIGH',
    environment: 'PRODUCTION',
    ownerDepartment: 'Banca Particulares',
    ipAddress: '10.100.12.10',
    operatingSystem: 'Debian 12 Bookworm',
    status: 'ACTIVE',
    providerId: 1,
    providerName: 'CloudScale European Infrastructure S.A.',
    openVulnerabilitiesCount: 2,
  },
  {
    id: 3,
    assetCode: 'DB-SEPA-01',
    name: 'SEPA Settlement Relay Cluster',
    assetType: 'DATABASE',
    criticality: 'CRITICAL',
    environment: 'PRODUCTION',
    ownerDepartment: 'Tesorería y Pagos SEPA',
    ipAddress: '10.100.8.40',
    operatingSystem: 'RHEL 9.4 (PostgreSQL 16)',
    status: 'ACTIVE',
    providerId: 2,
    providerName: 'SwiftFin Interbank Connectivity BV',
    openVulnerabilitiesCount: 0,
  },
];

interface DemoVulnRecord extends VulnerabilitySummaryDTO {
  description: string;
  remediationPlan: string | null;
  resolvedAt: string | null;
  affectedAssetIds: number[];
  assessmentsHistory: CvssAssessmentDTO[];
  auditTrail: AuditLogDTO[];
}

function buildInitialDemoVulns(): DemoVulnRecord[] {
  const baseRecords: Array<{
    summary: VulnerabilitySummaryDTO;
    description: string;
    remediationPlan: string;
    affectedAssetIds: number[];
  }> = [
    {
      summary: {
        id: 12,
        internalCode: 'VFU-0012',
        cveId: 'CVE-2024-21762',
        title:
          'Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos',
        status: 'PENDIENTE DE REMEDIACIÓN',
        cvssVersion: '3.1',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        cvssScore: 9.8,
        severity: 'CRITICAL',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-02-10',
        targetRemediationDate: '2026-03-01',
        affectedAssetsCount: 2,
        primaryProviderName: 'HostingSur S.L.',
      },
      description:
        'Vulnerabilidad crítica de escritura fuera de límites en la pasarela TLS gestionada por HostingSur S.L. que da servicio directo al activo «API de pagos». Exige remediación previa a la revisión contractual de marzo bajo DORA Capítulo V.',
      remediationPlan:
        'Aplicar parche de emergencia de la pasarela SSL/TLS y habilitar mitigación WAF perimetral con validación en staging.',
      affectedAssetIds: [8, 2],
    },
    {
      summary: {
        id: 2,
        internalCode: 'VFU-0002',
        cveId: 'CVE-2024-3400',
        title: 'Palo Alto Networks PAN-OS Command Injection in GlobalProtect Gateway',
        status: 'PENDIENTE DE REMEDIACIÓN',
        cvssVersion: '3.1',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
        cvssScore: 10.0,
        severity: 'CRITICAL',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-01-15',
        targetRemediationDate: '2026-01-18',
        affectedAssetsCount: 1,
        primaryProviderName: 'CyberShield Managed SOC & Edge Networks',
      },
      description:
        'Inyección de comandos en la interfaz de telemetría GlobalProtect del cortafuegos perimetral gestionado por CyberShield.',
      remediationPlan:
        'Desactivar telemetría de dispositivo y desplegar hotfix oficial PAN-OS 11.1.2-h3.',
      affectedAssetIds: [5],
    },
    {
      summary: {
        id: 7,
        internalCode: 'VFU-0007',
        cveId: 'CVE-2024-4577',
        title: 'PHP CGI Argument Injection Vulnerability on Windows',
        status: 'PENDIENTE DE REMEDIACIÓN',
        cvssVersion: '4.0',
        cvssVector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H',
        cvssScore: 9.8,
        severity: 'CRITICAL',
        assignedTo: 3,
        assignedUsername: 'analyst_appsec',
        discoveredAt: '2026-01-28',
        targetRemediationDate: '2026-02-10',
        affectedAssetsCount: 1,
        primaryProviderName: 'CloudScale European Infrastructure S.A.',
      },
      description:
        'Inyección de argumentos en intérprete CGI que permite ejecución remota de código bajo ciertas configuraciones de locale.',
      remediationPlan: 'Migrar portal heredado a PHP-FPM 8.3.8 en contenedor Linux aislado.',
      affectedAssetIds: [4],
    },
    {
      summary: {
        id: 1,
        internalCode: 'VFU-0001',
        cveId: 'CVE-2024-21413',
        title: 'Microsoft Outlook Remote Code Execution Vulnerability (Moniker Link)',
        status: 'ABIERTA',
        cvssVersion: '3.1',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H',
        cvssScore: 9.8,
        severity: 'CRITICAL',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-01-12',
        targetRemediationDate: '2026-01-20',
        affectedAssetsCount: 2,
        primaryProviderName: 'CloudScale European Infrastructure S.A.',
      },
      description:
        'Evasión de Protected View mediante enlaces Moniker que exponen credenciales NTLM y permiten ejecución arbitraria.',
      remediationPlan: 'Desplegar actualización acumulativa de seguridad y bloquear SMB saliente.',
      affectedAssetIds: [1, 4],
    },
    {
      summary: {
        id: 10,
        internalCode: 'VFU-0010',
        cveId: 'CVE-2024-21626',
        title: 'runc Container Escape via File Descriptor Leak (Leaky Vessels)',
        status: 'PENDIENTE DE REMEDIACIÓN',
        cvssVersion: '3.1',
        cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H',
        cvssScore: 8.6,
        severity: 'HIGH',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-02-05',
        targetRemediationDate: '2026-02-20',
        affectedAssetsCount: 2,
        primaryProviderName: 'HostingSur S.L.',
      },
      description:
        'Fuga de descriptor de fichero en runc que permite escapar del aislamiento de contenedor hacia el sistema anfitrión.',
      remediationPlan: 'Actualizar runtime runc >= 1.1.12 en nodos Kubernetes de producción.',
      affectedAssetIds: [8, 1],
    },
    {
      summary: {
        id: 3,
        internalCode: 'VFU-0003',
        cveId: 'CVE-2024-6387',
        title: 'OpenSSH regreSSHion Signal Handler Race Condition Remote Code Execution',
        status: 'ABIERTA',
        cvssVersion: '4.0',
        cvssVector: 'CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N',
        cvssScore: 8.1,
        severity: 'HIGH',
        assignedTo: 3,
        assignedUsername: 'analyst_appsec',
        discoveredAt: '2026-01-18',
        targetRemediationDate: '2026-02-01',
        affectedAssetsCount: 2,
        primaryProviderName: 'CloudScale European Infrastructure S.A.',
      },
      description:
        'Condición de carrera en el manejador de señales SIGALRM de sshd en sistemas glibc Linux.',
      remediationPlan: 'Actualizar OpenSSH a 9.8p1 y restringir acceso SSH por bastión VPN.',
      affectedAssetIds: [1, 2],
    },
    {
      summary: {
        id: 4,
        internalCode: 'VFU-0004',
        cveId: 'CVE-2023-44487',
        title: 'HTTP/2 Rapid Reset Denial of Service Vulnerability',
        status: 'RESUELTA',
        cvssVersion: '3.1',
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',
        cvssScore: 7.5,
        severity: 'HIGH',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-01-20',
        targetRemediationDate: '2026-02-05',
        affectedAssetsCount: 2,
        primaryProviderName: 'HostingSur S.L.',
      },
      description:
        'Ataque de denegación de servicio mediante cancelación masiva de flujos HTTP/2 RST_STREAM.',
      remediationPlan: 'Parche aplicado en balanceador Nginx/Envoy y validado en staging.',
      affectedAssetIds: [8, 2],
    },
    {
      summary: {
        id: 15,
        internalCode: 'VFU-0015',
        cveId: 'CVE-2024-22243',
        title: 'Spring Framework URL Parsing Open Redirect and SSRF',
        status: 'ABIERTA',
        cvssVersion: '4.0',
        cvssVector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N',
        cvssScore: 5.1,
        severity: 'MEDIUM',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-02-14',
        targetRemediationDate: '2026-03-14',
        affectedAssetsCount: 2,
        primaryProviderName: 'HostingSur S.L.',
      },
      description:
        'Procesamiento permisivo de URLs externas en UriComponentsBuilder que facilita redirecciones abiertas.',
      remediationPlan: 'Actualizar Spring Framework a versión corregida y validar lista blanca.',
      affectedAssetIds: [8, 1],
    },
    {
      summary: {
        id: 20,
        internalCode: 'VFU-0020',
        cveId: 'CVE-2024-38816',
        title: 'Spring Framework Path Traversal via Static Resource Handlers',
        status: 'PENDIENTE DE REMEDIACIÓN',
        cvssVersion: '4.0',
        cvssVector: 'CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
        cvssScore: 2.6,
        severity: 'LOW',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-02-19',
        targetRemediationDate: '2026-05-15',
        affectedAssetsCount: 1,
        primaryProviderName: 'CloudScale European Infrastructure S.A.',
      },
      description:
        'Exposición acotada en manejadores funcionales de recursos estáticos bajo condiciones específicas de enrutado.',
      remediationPlan: 'Planificado parcheo en ventana mensual de mantenimiento.',
      affectedAssetIds: [1],
    },
    {
      summary: {
        id: 11,
        internalCode: 'VFU-0011',
        cveId: 'CVE-2024-3094',
        title: 'XZ Utils Malicious Backdoor Injection in liblzma',
        status: 'CERRADA',
        cvssVersion: '4.0',
        cvssVector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H',
        cvssScore: 10.0,
        severity: 'CRITICAL',
        assignedTo: 2,
        assignedUsername: 'analyst_soc',
        discoveredAt: '2026-02-07',
        targetRemediationDate: '2026-02-09',
        affectedAssetsCount: 2,
        primaryProviderName: 'CloudScale European Infrastructure S.A.',
      },
      description:
        'Compromiso en la cadena de suministro de paquetes xz-utils 5.6.0/5.6.1. Verificado que ningún nodo en producción quedó afectado tras auditoría de SBOM.',
      remediationPlan: 'Fijada versión limpia 5.4.5 y auditadas todas las imágenes base.',
      affectedAssetIds: [1, 2],
    },
  ];

  return baseRecords.map((item, idx) => ({
    ...item.summary,
    description: item.description,
    remediationPlan: item.remediationPlan,
    resolvedAt:
      item.summary.status === 'RESUELTA' || item.summary.status === 'CERRADA'
        ? '2026-02-15T11:30:00Z'
        : null,
    affectedAssetIds: item.affectedAssetIds,
    assessmentsHistory: [
      {
        id: 100 + idx,
        vulnerabilityId: item.summary.id,
        assessedBy: 2,
        assessedByUsername: 'analyst_soc',
        cvssVersion: item.summary.cvssVersion,
        cvssVector: item.summary.cvssVector,
        cvssScore: item.summary.cvssScore,
        severity: item.summary.severity,
        isCurrent: true,
        assessedAt: `${item.summary.discoveredAt}T09:15:00Z`,
      },
    ],
    auditTrail: [
      {
        id: 500 + idx * 2,
        vulnerabilityId: item.summary.id,
        userId: 2,
        username: 'analyst_soc',
        actionType: 'CREATE',
        previousStatus: null,
        newStatus: 'ABIERTA',
        justification: `Registro inicial con evaluación CVSS v${item.summary.cvssVersion} (${item.summary.cvssScore.toFixed(1)} ${item.summary.severity}).`,
        createdAt: `${item.summary.discoveredAt}T09:15:00Z`,
      },
      ...(item.summary.status !== 'ABIERTA'
        ? [
            {
              id: 501 + idx * 2,
              vulnerabilityId: item.summary.id,
              userId: item.summary.status === 'CERRADA' ? 1 : 2,
              username: item.summary.status === 'CERRADA' ? 'admin_dora' : 'analyst_soc',
              actionType: 'STATUS_CHANGE',
              previousStatus: 'ABIERTA' as VulnerabilityStatus,
              newStatus: item.summary.status,
              justification:
                item.summary.status === 'CERRADA'
                  ? 'Cierre formal auditado por CISO tras verificación en producción.'
                  : 'Actualización del ciclo de vida registrada en el seguimiento SLA DORA.',
              createdAt: `${item.summary.discoveredAt}T14:40:00Z`,
            },
          ]
        : []),
    ],
  }));
}

let providersState: IctProviderDTO[] = INITIAL_DEMO_PROVIDERS.map((p) => ({ ...p }));
let assetsState: AssetDTO[] = INITIAL_DEMO_ASSETS.map((a) => ({ ...a }));
let vulnsState: DemoVulnRecord[] = buildInitialDemoVulns();
let nextIdCounter = 1000;

function recomputeDerivedMetrics(): void {
  const activeStatuses = new Set<VulnerabilityStatus>(['ABIERTA', 'PENDIENTE DE REMEDIACIÓN']);

  assetsState = assetsState.map((asset) => {
    const provider = providersState.find((p) => p.id === asset.providerId);
    const openCount = vulnsState.filter(
      (v) => activeStatuses.has(v.status) && v.affectedAssetIds.includes(asset.id)
    ).length;
    return {
      ...asset,
      providerName: provider?.name ?? asset.providerName,
      openVulnerabilitiesCount: openCount,
    };
  });

  providersState = providersState.map((provider) => {
    const managedAssets = assetsState.filter((a) => a.providerId === provider.id);
    const managedAssetIds = new Set(managedAssets.map((a) => a.id));
    const activeHighCrit = vulnsState.filter(
      (v) =>
        activeStatuses.has(v.status) &&
        (v.severity === 'CRITICAL' || v.severity === 'HIGH') &&
        v.affectedAssetIds.some((aid) => managedAssetIds.has(aid))
    ).length;

    return {
      ...provider,
      managedAssetsCount: managedAssets.length,
      activeCriticalHighVulnsCount: activeHighCrit,
      doraRiskStatus: activeHighCrit > 0 ? 'AT_RISK' : 'COMPLIANT',
    };
  });
}

recomputeDerivedMetrics();

function toSummary(v: DemoVulnRecord): VulnerabilitySummaryDTO {
  const firstAsset = assetsState.find((a) => v.affectedAssetIds.includes(a.id));
  return {
    id: v.id,
    internalCode: v.internalCode,
    cveId: v.cveId,
    title: v.title,
    status: v.status,
    cvssVersion: v.cvssVersion,
    cvssVector: v.cvssVector,
    cvssScore: v.cvssScore,
    severity: v.severity,
    assignedTo: v.assignedTo,
    assignedUsername: v.assignedUsername,
    discoveredAt: v.discoveredAt,
    targetRemediationDate: v.targetRemediationDate,
    affectedAssetsCount: v.affectedAssetIds.length,
    primaryProviderName: firstAsset?.providerName ?? v.primaryProviderName,
  };
}

function toDetail(v: DemoVulnRecord): VulnerabilityDetailDTO {
  const affectedAssets = assetsState.filter((a) => v.affectedAssetIds.includes(a.id));
  return {
    ...toSummary(v),
    description: v.description,
    remediationPlan: v.remediationPlan,
    resolvedAt: v.resolvedAt,
    affectedAssets,
    assessmentsHistory: [...v.assessmentsHistory],
    comments: [],
    auditTrail: [...v.auditTrail],
  };
}

export const demoStore = {
  getDashboardSummary(): DashboardSummaryResponse {
    recomputeDerivedMetrics();
    const bySeverity: Record<CvssSeverity, number> = {
      NONE: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    const byStatus: Record<VulnerabilityStatus, number> = {
      ABIERTA: 0,
      'PENDIENTE DE REMEDIACIÓN': 0,
      RESUELTA: 0,
      CERRADA: 0,
    };

    let openAndPendingCount = 0;
    let criticalOpenCount = 0;

    for (const v of vulnsState) {
      bySeverity[v.severity] += 1;
      byStatus[v.status] += 1;
      if (v.status === 'ABIERTA' || v.status === 'PENDIENTE DE REMEDIACIÓN') {
        openAndPendingCount += 1;
        if (v.severity === 'CRITICAL') {
          criticalOpenCount += 1;
        }
      }
    }

    const providersAtRisk = providersState.filter((p) => p.doraRiskStatus === 'AT_RISK');

    return {
      totalVulnerabilities: vulnsState.length,
      openAndPendingCount,
      criticalOpenCount,
      providersAtRiskCount: providersAtRisk.length,
      bySeverity,
      byStatus,
      providersAtRisk,
    };
  },

  getVulnerabilities(
    params: VulnerabilityFilterParams
  ): PaginatedResponse<VulnerabilitySummaryDTO> {
    recomputeDerivedMetrics();
    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const q = params.search?.trim().toLowerCase() ?? '';

    const filtered = vulnsState
      .filter((v) => !params.severity || v.severity === params.severity)
      .filter((v) => !params.status || v.status === params.status)
      .filter((v) => !params.assetId || v.affectedAssetIds.includes(params.assetId))
      .filter((v) => {
        if (!params.providerId) return true;
        return v.affectedAssetIds.some((aid) => {
          const asset = assetsState.find((a) => a.id === aid);
          return asset?.providerId === params.providerId;
        });
      })
      .filter((v) => {
        if (!q) return true;
        return (
          v.internalCode.toLowerCase().includes(q) ||
          (v.cveId ?? '').toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          (v.primaryProviderName ?? '').toLowerCase().includes(q)
        );
      });

    const sortKey = params.sort ?? 'cvssScore,desc';
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'cvssScore,asc':
          return a.cvssScore - b.cvssScore;
        case 'discoveredAt,desc':
          return b.discoveredAt.localeCompare(a.discoveredAt);
        case 'discoveredAt,asc':
          return a.discoveredAt.localeCompare(b.discoveredAt);
        case 'internalCode,asc':
          return a.internalCode.localeCompare(b.internalCode);
        case 'internalCode,desc':
          return b.internalCode.localeCompare(a.internalCode);
        default:
          return b.cvssScore - a.cvssScore;
      }
    });

    const totalElements = sorted.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
    const slice = sorted.slice(page * size, (page + 1) * size).map(toSummary);

    return {
      content: slice,
      page,
      size,
      totalElements,
      totalPages,
      last: totalPages === 0 || page + 1 >= totalPages,
    };
  },

  getVulnerabilityById(id: number): VulnerabilityDetailDTO {
    const found = vulnsState.find((v) => v.id === id);
    if (!found) {
      throw new Error(`No se encontró la vulnerabilidad con id: ${id}`);
    }
    return toDetail(found);
  },

  createVulnerability(
    req: VulnerabilityCreateRequest,
    actingUser: UserSummaryDTO
  ): VulnerabilityDetailDTO {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): el rol VIEWER no puede registrar vulnerabilidades.');
    }
    const validation = validateCvssAssessment(
      req.cvssVersion,
      req.cvssVector,
      req.cvssScore,
      req.severity
    );
    if (!validation.valid || validation.normalizedScore === null) {
      throw new Error(validation.errorMessage ?? 'Evaluación CVSS inválida.');
    }
    if (
      vulnsState.some(
        (v) => v.internalCode.toLowerCase() === req.internalCode.trim().toLowerCase()
      )
    ) {
      throw new Error(`Ya existe una vulnerabilidad con código interno ${req.internalCode}.`);
    }

    const id = ++nextIdCounter;
    const nowIso = new Date().toISOString();
    const today = req.discoveredAt || nowIso.slice(0, 10);
    const firstAsset = assetsState.find((a) => req.affectedAssetIds.includes(a.id));

    const record: DemoVulnRecord = {
      id,
      internalCode: req.internalCode.trim().toUpperCase(),
      cveId: req.cveId?.trim() || null,
      title: req.title.trim(),
      description: req.description.trim(),
      status: 'ABIERTA',
      cvssVersion: req.cvssVersion,
      cvssVector: req.cvssVector.trim(),
      cvssScore: validation.normalizedScore,
      severity: req.severity,
      remediationPlan: req.remediationPlan?.trim() || null,
      assignedTo: req.assignedTo ?? actingUser.id,
      assignedUsername: actingUser.username,
      discoveredAt: today,
      targetRemediationDate: req.targetRemediationDate || null,
      resolvedAt: null,
      affectedAssetsCount: req.affectedAssetIds.length,
      primaryProviderName: firstAsset?.providerName ?? null,
      affectedAssetIds: [...req.affectedAssetIds],
      assessmentsHistory: [
        {
          id: ++nextIdCounter,
          vulnerabilityId: id,
          assessedBy: actingUser.id,
          assessedByUsername: actingUser.username,
          cvssVersion: req.cvssVersion,
          cvssVector: req.cvssVector.trim(),
          cvssScore: validation.normalizedScore,
          severity: req.severity,
          isCurrent: true,
          assessedAt: nowIso,
        },
      ],
      auditTrail: [
        {
          id: ++nextIdCounter,
          vulnerabilityId: id,
          userId: actingUser.id,
          username: actingUser.username,
          actionType: 'CREATE',
          previousStatus: null,
          newStatus: 'ABIERTA',
          justification: `Alta inicial con vector ${req.cvssVector.trim()} (${validation.normalizedScore.toFixed(1)} ${req.severity}).`,
          createdAt: nowIso,
        },
      ],
    };

    vulnsState = [record, ...vulnsState];
    recomputeDerivedMetrics();
    return toDetail(record);
  },

  updateVulnerabilityStatus(
    id: number,
    req: StatusTransitionRequest,
    actingUser: UserSummaryDTO
  ): VulnerabilityDetailDTO {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): el rol VIEWER es de solo lectura.');
    }
    const found = vulnsState.find((v) => v.id === id);
    if (!found) {
      throw new Error(`No se encontró la vulnerabilidad con id: ${id}`);
    }
    const allowed = getAllowedTransitions(found.status).map((t) => t.target);
    if (!allowed.includes(req.newStatus)) {
      throw new Error(
        `Transición de estado no permitida: ${found.status} → ${req.newStatus}.`
      );
    }
    if (req.newStatus === 'CERRADA' && actingUser.role !== 'ADMIN') {
      throw new Error(
        'Solo el rol ADMIN puede cerrar formalmente (CERRADA) una vulnerabilidad (403 Forbidden).'
      );
    }
    if (req.justification.trim().length < 10) {
      throw new Error('La justificación de auditoría debe tener al menos 10 caracteres.');
    }

    const nowIso = new Date().toISOString();
    const updated: DemoVulnRecord = {
      ...found,
      status: req.newStatus,
      resolvedAt:
        req.newStatus === 'RESUELTA' || req.newStatus === 'CERRADA'
          ? nowIso
          : req.newStatus === 'ABIERTA'
            ? null
            : found.resolvedAt,
      auditTrail: [
        ...found.auditTrail,
        {
          id: ++nextIdCounter,
          vulnerabilityId: found.id,
          userId: actingUser.id,
          username: actingUser.username,
          actionType: 'STATUS_CHANGE',
          previousStatus: found.status,
          newStatus: req.newStatus,
          justification: req.justification.trim(),
          createdAt: nowIso,
        },
      ],
    };

    vulnsState = vulnsState.map((v) => (v.id === id ? updated : v));
    recomputeDerivedMetrics();
    return toDetail(updated);
  },

  addCvssAssessment(
    id: number,
    req: CvssAssessmentCreateRequest,
    actingUser: UserSummaryDTO
  ): CvssAssessmentDTO {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): el rol VIEWER no puede re-evaluar CVSS.');
    }
    const found = vulnsState.find((v) => v.id === id);
    if (!found) {
      throw new Error(`No se encontró la vulnerabilidad con id: ${id}`);
    }
    const validation = validateCvssAssessment(
      req.cvssVersion,
      req.cvssVector,
      req.cvssScore,
      req.severity
    );
    if (!validation.valid || validation.normalizedScore === null) {
      throw new Error(validation.errorMessage ?? 'Evaluación CVSS inválida.');
    }

    const nowIso = new Date().toISOString();
    const newAssessment: CvssAssessmentDTO = {
      id: ++nextIdCounter,
      vulnerabilityId: id,
      assessedBy: actingUser.id,
      assessedByUsername: actingUser.username,
      cvssVersion: req.cvssVersion,
      cvssVector: req.cvssVector.trim(),
      cvssScore: validation.normalizedScore,
      severity: req.severity,
      isCurrent: true,
      assessedAt: nowIso,
    };

    const updated: DemoVulnRecord = {
      ...found,
      cvssVersion: req.cvssVersion,
      cvssVector: req.cvssVector.trim(),
      cvssScore: validation.normalizedScore,
      severity: req.severity,
      assessmentsHistory: [
        ...found.assessmentsHistory.map((a) => ({ ...a, isCurrent: false })),
        newAssessment,
      ],
      auditTrail: [
        ...found.auditTrail,
        {
          id: ++nextIdCounter,
          vulnerabilityId: id,
          userId: actingUser.id,
          username: actingUser.username,
          actionType: 'CVSS_REASSESSMENT',
          previousStatus: found.status,
          newStatus: found.status,
          justification:
            req.justification?.trim() ||
            `Re-evaluación CVSS v${req.cvssVersion}: ${validation.normalizedScore.toFixed(1)} (${req.severity}).`,
          createdAt: nowIso,
        },
      ],
    };

    vulnsState = vulnsState.map((v) => (v.id === id ? updated : v));
    recomputeDerivedMetrics();
    return newAssessment;
  },

  deleteVulnerability(id: number, actingUser: UserSummaryDTO): void {
    if (actingUser.role !== 'ADMIN') {
      throw new Error('Acceso denegado (403): solo el rol ADMIN puede eliminar vulnerabilidades.');
    }
    vulnsState = vulnsState.filter((v) => v.id !== id);
    recomputeDerivedMetrics();
  },

  importBatch(rawJson: string, actingUser: UserSummaryDTO): BatchImportResultDTO {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): el rol VIEWER no puede importar lotes.');
    }
    const start = performance.now();
    const parsed = JSON.parse(rawJson) as unknown;
    const items = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' &&
          parsed !== null &&
          'items' in parsed &&
          Array.isArray((parsed as { items: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : null;

    if (!items || items.length === 0) {
      throw new Error('El lote JSON debe contener un array no vacío de vulnerabilidades.');
    }

    // Validate ALL items atomically first (simulating @Transactional ROLLBACK)
    const staged: DemoVulnRecord[] = [];
    const seenCodes = new Set(vulnsState.map((v) => v.internalCode.toUpperCase()));

    items.forEach((rawItem, index) => {
      const item = rawItem as Record<string, unknown>;
      const code = String(item.internal_code ?? item.internalCode ?? '').trim().toUpperCase();
      const version = String(item.cvss_version ?? item.cvssVersion ?? '') as CvssVersion;
      const vector = String(item.cvss_vector ?? item.cvssVector ?? '');
      const score = Number(item.cvss_score ?? item.cvssScore);
      const severity = String(item.severity ?? '') as CvssSeverity;
      const title = String(item.title ?? '').trim();
      const description = String(item.description ?? '').trim();
      const assetIdsRaw = (item.affected_asset_ids ?? item.affectedAssetIds) as number[] | undefined;
      const assetIds = Array.isArray(assetIdsRaw) && assetIdsRaw.length > 0 ? assetIdsRaw : [1];

      if (!code || !title) {
        throw new Error(
          `Registro #${index + 1} inválido: internal_code y title son obligatorios. Transacción revertida (ROLLBACK: 0 insertados).`
        );
      }
      if (seenCodes.has(code)) {
        throw new Error(
          `Registro #${index + 1} (${code}): ya existe un código interno duplicado. Transacción revertida (ROLLBACK: 0 insertados).`
        );
      }
      if (version !== '3.1' && version !== '4.0') {
        throw new Error(
          `Registro #${index + 1} (${code}): cvss_version inválida '${version}'. Transacción revertida (ROLLBACK: 0 insertados).`
        );
      }

      const check = validateCvssAssessment(version, vector, score, severity);
      if (!check.valid || check.normalizedScore === null) {
        throw new Error(
          `ROLLBACK ATÓMICO ejecutado al validar registro #${index + 1} (${code}): ${check.errorMessage} Ninguno de los ${items.length} registros ha sido persistido.`
        );
      }

      seenCodes.add(code);
      const id = ++nextIdCounter;
      const nowIso = new Date().toISOString();
      const discoveredAt = String(item.discovered_at ?? item.discoveredAt ?? nowIso.slice(0, 10));
      const firstAsset = assetsState.find((a) => assetIds.includes(a.id));

      staged.push({
        id,
        internalCode: code,
        cveId: item.cve_id ? String(item.cve_id) : item.cveId ? String(item.cveId) : null,
        title,
        description: description || title,
        status: 'ABIERTA',
        cvssVersion: version,
        cvssVector: vector,
        cvssScore: check.normalizedScore,
        severity,
        remediationPlan: item.remediation_plan
          ? String(item.remediation_plan)
          : item.remediationPlan
            ? String(item.remediationPlan)
            : null,
        assignedTo: actingUser.id,
        assignedUsername: actingUser.username,
        discoveredAt,
        targetRemediationDate: item.target_remediation_date
          ? String(item.target_remediation_date)
          : item.targetRemediationDate
            ? String(item.targetRemediationDate)
            : null,
        resolvedAt: null,
        affectedAssetsCount: assetIds.length,
        primaryProviderName: firstAsset?.providerName ?? null,
        affectedAssetIds: assetIds,
        assessmentsHistory: [
          {
            id: ++nextIdCounter,
            vulnerabilityId: id,
            assessedBy: actingUser.id,
            assessedByUsername: actingUser.username,
            cvssVersion: version,
            cvssVector: vector,
            cvssScore: check.normalizedScore,
            severity,
            isCurrent: true,
            assessedAt: nowIso,
          },
        ],
        auditTrail: [
          {
            id: ++nextIdCounter,
            vulnerabilityId: id,
            userId: actingUser.id,
            username: actingUser.username,
            actionType: 'BATCH_IMPORT',
            previousStatus: null,
            newStatus: 'ABIERTA',
            justification: `Alta atómica vía importación masiva JSON (${items.length} registros).`,
            createdAt: nowIso,
          },
        ],
      });
    });

    // Commit only if 100% of records passed validation
    vulnsState = [...staged, ...vulnsState];
    recomputeDerivedMetrics();

    return {
      jobId: `demo-batch-${Date.now()}`,
      status: 'COMMITTED',
      totalSubmitted: items.length,
      insertedCount: staged.length,
      rolledBack: false,
      workerThreadsUsed: Math.min(4, items.length),
      executionTimeMs: Math.max(2, Math.round(performance.now() - start)),
      errors: [],
    };
  },

  getAssets(params: AssetFilterParams): PaginatedResponse<AssetDTO> {
    recomputeDerivedMetrics();
    const page = params.page ?? 0;
    const size = params.size ?? 10;
    const q = params.search?.trim().toLowerCase() ?? '';

    const filtered = assetsState
      .filter((a) => !params.providerId || a.providerId === params.providerId)
      .filter((a) => !params.criticality || a.criticality === params.criticality)
      .filter((a) => !params.environment || a.environment === params.environment)
      .filter(
        (a) =>
          !q ||
          a.assetCode.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.providerName.toLowerCase().includes(q)
      );

    const totalElements = filtered.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
    const slice = filtered.slice(page * size, (page + 1) * size);

    return {
      content: slice,
      page,
      size,
      totalElements,
      totalPages,
      last: totalPages === 0 || page + 1 >= totalPages,
    };
  },

  createAsset(req: AssetCreateRequest, actingUser: UserSummaryDTO): AssetDTO {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): el rol VIEWER no puede crear activos.');
    }
    const provider = providersState.find((p) => p.id === req.providerId);
    if (!provider) {
      throw new Error(`No existe el proveedor TIC con id: ${req.providerId}`);
    }
    if (
      assetsState.some(
        (a) => a.assetCode.toLowerCase() === req.assetCode.trim().toLowerCase()
      )
    ) {
      throw new Error(`Ya existe un activo con código ${req.assetCode}.`);
    }

    const created: AssetDTO = {
      id: ++nextIdCounter,
      assetCode: req.assetCode.trim().toUpperCase(),
      name: req.name.trim(),
      assetType: req.assetType,
      criticality: req.criticality,
      environment: req.environment,
      ownerDepartment: req.ownerDepartment.trim(),
      ipAddress: req.ipAddress?.trim() || null,
      operatingSystem: req.operatingSystem?.trim() || null,
      status: 'ACTIVE',
      providerId: provider.id,
      providerName: provider.name,
      openVulnerabilitiesCount: 0,
    };

    assetsState = [created, ...assetsState];
    recomputeDerivedMetrics();
    return created;
  },

  getProviders(params: ProviderFilterParams = {}): IctProviderDTO[] {
    recomputeDerivedMetrics();
    return providersState
      .filter((p) => !params.criticality || p.criticality === params.criticality)
      .filter((p) => !params.contractStatus || p.contractStatus === params.contractStatus)
      .filter((p) => !params.atRiskOnly || p.doraRiskStatus === 'AT_RISK');
  },

  createProvider(req: IctProviderUpsertRequest, actingUser: UserSummaryDTO): IctProviderDTO {
    if (actingUser.role !== 'ADMIN') {
      throw new Error('Acceso denegado (403): solo el rol ADMIN puede registrar proveedores TIC.');
    }
    if (
      providersState.some(
        (p) => p.providerCode.toLowerCase() === req.providerCode.trim().toLowerCase()
      )
    ) {
      throw new Error(`Ya existe un proveedor con código ${req.providerCode}.`);
    }

    const created: IctProviderDTO = {
      id: ++nextIdCounter,
      providerCode: req.providerCode.trim().toUpperCase(),
      name: req.name.trim(),
      providedService: req.providedService.trim(),
      criticality: req.criticality,
      contractReference: req.contractReference.trim(),
      contractStatus: req.contractStatus,
      reviewDate: req.reviewDate,
      contactEmail: req.contactEmail.trim(),
      countryCode: req.countryCode.trim().toUpperCase(),
      slaAvailabilityPct: req.slaAvailabilityPct,
      managedAssetsCount: 0,
      activeCriticalHighVulnsCount: 0,
      doraRiskStatus: 'COMPLIANT',
    };

    providersState = [created, ...providersState];
    recomputeDerivedMetrics();
    return created;
  },

  updateProvider(
    id: number,
    req: IctProviderUpsertRequest,
    actingUser: UserSummaryDTO
  ): IctProviderDTO {
    if (actingUser.role !== 'ADMIN') {
      throw new Error('Acceso denegado (403): solo el rol ADMIN puede editar proveedores TIC.');
    }
    const existing = providersState.find((p) => p.id === id);
    if (!existing) {
      throw new Error(`No existe el proveedor TIC con id: ${id}`);
    }

    const updated: IctProviderDTO = {
      ...existing,
      providerCode: req.providerCode.trim().toUpperCase(),
      name: req.name.trim(),
      providedService: req.providedService.trim(),
      criticality: req.criticality,
      contractReference: req.contractReference.trim(),
      contractStatus: req.contractStatus,
      reviewDate: req.reviewDate,
      contactEmail: req.contactEmail.trim(),
      countryCode: req.countryCode.trim().toUpperCase(),
      slaAvailabilityPct: req.slaAvailabilityPct,
    };

    providersState = providersState.map((p) => (p.id === id ? updated : p));
    recomputeDerivedMetrics();
    return providersState.find((p) => p.id === id) ?? updated;
  },

  getProviderDoraReport(id: number): ProviderDoraReportDTO {
    recomputeDerivedMetrics();
    const provider = providersState.find((p) => p.id === id);
    if (!provider) {
      throw new Error(`No existe el proveedor TIC con id: ${id}`);
    }
    const managedAssets = assetsState.filter((a) => a.providerId === id);
    const assetIds = new Set(managedAssets.map((a) => a.id));
    const pendingVulnerabilities = vulnsState
      .filter(
        (v) =>
          (v.status === 'ABIERTA' || v.status === 'PENDIENTE DE REMEDIACIÓN') &&
          v.affectedAssetIds.some((aid) => assetIds.has(aid))
      )
      .map(toSummary);

    const riskJustification =
      provider.doraRiskStatus === 'AT_RISK'
        ? `Proveedor ${provider.name} con revisión contractual ${provider.reviewDate} presenta ${provider.activeCriticalHighVulnsCount} vulnerabilidad(es) HIGH/CRITICAL activa(s) en activos gestionados.`
        : `Proveedor ${provider.name} conforme con DORA Cap. V sin vulnerabilidades HIGH/CRITICAL abiertas.`;

    return {
      provider,
      generatedAt: new Date().toISOString(),
      doraRiskStatus: provider.doraRiskStatus,
      riskJustification,
      managedAssets,
      pendingVulnerabilities,
    };
  },

  getRecentAuditEvents(limit = 4): Array<{
    id: number;
    vulnerabilityId: number;
    internalCode: string;
    username: string;
    actionType: string;
    newStatus: VulnerabilityStatus;
    createdAt: string;
  }> {
    const all = vulnsState.flatMap((v) =>
      v.auditTrail.map((entry) => ({
        id: entry.id,
        vulnerabilityId: v.id,
        internalCode: v.internalCode,
        username: entry.username,
        actionType: entry.actionType,
        newStatus: entry.newStatus ?? v.status,
        createdAt: entry.createdAt,
      }))
    );
    return all
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  },

  exportReport(params: ReportExportParams, actingUser: UserSummaryDTO): string {
    if (actingUser.role === 'VIEWER') {
      throw new Error('Acceso denegado (403): solo ADMIN y ANALYST pueden exportar informes.');
    }
    const page = this.getVulnerabilities({
      severity: params.severity,
      status: params.status,
      providerId: params.providerId,
      page: 0,
      size: 100,
    });

    if (params.format === 'HTML') {
      const rows = page.content
        .map(
          (v) =>
            `<tr><td>${escapeHtml(v.internalCode)}</td><td>${escapeHtml(v.cveId ?? '')}</td><td>${escapeHtml(v.title)}</td><td>v${escapeHtml(v.cvssVersion)} (${v.cvssScore.toFixed(1)})</td><td>${escapeHtml(v.severity)}</td><td>${escapeHtml(v.status)}</td><td>${escapeHtml(v.primaryProviderName ?? '-')}</td></tr>`
        )
        .join('');
      return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>VulnFollowUp — Informe Ejecutivo DORA</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;font-size:13px}th{background:#f1f5f9}</style></head><body><h1>VulnFollowUp · Informe Ejecutivo DORA &amp; CVSS (Modo Demo Offline)</h1><p>Generado: ${new Date().toISOString()} · Total registros: ${page.content.length}</p><table><thead><tr><th>Código</th><th>CVE</th><th>Título</th><th>CVSS</th><th>Severidad</th><th>Estado</th><th>Proveedor TIC</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    }

    const header = 'internal_code,cve_id,title,cvss_version,cvss_score,severity,status,provider\n';
    const lines = page.content.map((v) =>
      [
        v.internalCode,
        v.cveId ?? '',
        `"${v.title.replace(/"/g, '""')}"`,
        v.cvssVersion,
        v.cvssScore.toFixed(1),
        v.severity,
        `"${v.status}"`,
        `"${(v.primaryProviderName ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    return header + lines.join('\n');
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
