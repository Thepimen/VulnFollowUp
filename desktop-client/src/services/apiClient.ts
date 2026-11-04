import type {
  AssetDTO,
  DashboardSummaryResponse,
  IctProviderDTO,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  ProviderDoraReportDTO,
  VulnerabilityFilterParams,
  VulnerabilitySummaryDTO,
} from '../types/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const TOKEN_STORAGE_KEY = 'vulnfollowup_jwt_token';

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: `HTTP ${response.status} ${response.statusText}`,
    }));
    throw new Error(errorBody.message || `API Error (${response.status})`);
  }

  return (await response.json()) as T;
}

export const PHASE1_PROVIDERS: IctProviderDTO[] = [
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
    activeCriticalHighVulnsCount: 2,
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
    activeCriticalHighVulnsCount: 1,
    doraRiskStatus: 'AT_RISK',
  },
];

export const PHASE1_ASSETS: AssetDTO[] = [
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
    openVulnerabilitiesCount: 3,
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
];

export const PHASE1_VULNERABILITIES: VulnerabilitySummaryDTO[] = [
  {
    id: 12,
    internalCode: 'VFU-0012',
    cveId: 'CVE-2024-21762',
    title: 'Ejecución remota de código (RCE) por escritura fuera de límites en pasarela API de pagos',
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
  {
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
  {
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
  {
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
  {
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
    affectedAssetsCount: 3,
    primaryProviderName: 'HostingSur S.L.',
  },
  {
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
    affectedAssetsCount: 3,
    primaryProviderName: 'CloudScale European Infrastructure S.A.',
  },
  {
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
    affectedAssetsCount: 3,
    primaryProviderName: 'HostingSur S.L.',
  },
  {
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
    affectedAssetsCount: 3,
    primaryProviderName: 'HostingSur S.L.',
  },
  {
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
  {
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
];

export const apiService = {
  login: (payload: LoginRequest) =>
    requestJson<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDashboardSummary: () =>
    requestJson<DashboardSummaryResponse>('/api/dashboard/summary'),

  getVulnerabilities: (params: VulnerabilityFilterParams) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        query.set(k, String(v));
      }
    });
    return requestJson<PaginatedResponse<VulnerabilitySummaryDTO>>(
      `/api/vulnerabilities?${query.toString()}`
    );
  },

  getAssets: (page = 0, size = 10) =>
    requestJson<PaginatedResponse<AssetDTO>>(
      `/api/assets?page=${page}&size=${size}`
    ),

  getProviders: () => requestJson<IctProviderDTO[]>('/api/providers'),

  getProviderDoraReport: (id: number) =>
    requestJson<ProviderDoraReportDTO>(`/api/providers/${id}/report`),
};
