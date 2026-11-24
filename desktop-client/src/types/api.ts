/**
 * VulnFollowUp — Strict TypeScript DTO Contracts
 * Synchronized 1:1 with backend ApiDtos.java, docs/api/openapi.yaml and database/schema/01_schema.sql
 */

export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export type VulnerabilityStatus =
  | 'ABIERTA'
  | 'PENDIENTE DE REMEDIACIÓN'
  | 'RESUELTA'
  | 'CERRADA';

export type CvssVersion = '3.1' | '4.0';

export type CvssSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ProviderCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ContractStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED' | 'TERMINATED';

export type DoraRiskStatus = 'COMPLIANT' | 'AT_RISK';

export type AssetCriticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AssetEnvironment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'DR';

export type AssetType =
  | 'API_SERVICE'
  | 'APPLICATION_SERVER'
  | 'API_GATEWAY'
  | 'WEB_SERVER'
  | 'DATABASE'
  | 'NETWORK_DEVICE'
  | 'BUILD_SERVER'
  | 'IDENTITY_PROVIDER'
  | 'ENDPOINT';

export interface FieldIssueDTO {
  field: string;
  issue: string;
}

export interface UserSummaryDTO {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: UserSummaryDTO;
  userId?: number;
  username?: string;
  role?: UserRole;
  authenticated?: boolean;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface AssetDTO {
  id: number;
  assetCode: string;
  name: string;
  assetType: AssetType | string;
  criticality: AssetCriticality;
  environment: AssetEnvironment | string;
  ownerDepartment: string;
  ipAddress: string | null;
  operatingSystem: string | null;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;
  providerId: number;
  providerName: string;
  openVulnerabilitiesCount: number;
}

export interface AssetCreateRequest {
  assetCode: string;
  name: string;
  assetType: AssetType;
  criticality: AssetCriticality;
  environment: AssetEnvironment;
  ownerDepartment: string;
  ipAddress?: string | null;
  operatingSystem?: string | null;
  providerId: number;
}

export interface AssetFilterParams {
  providerId?: number;
  criticality?: AssetCriticality | '';
  environment?: AssetEnvironment | '';
  search?: string;
  page?: number;
  size?: number;
}

export interface VulnerabilitySummaryDTO {
  id: number;
  internalCode: string;
  cveId: string | null;
  title: string;
  status: VulnerabilityStatus;
  cvssVersion: CvssVersion;
  cvssVector: string;
  cvssScore: number;
  severity: CvssSeverity;
  assignedTo: number | null;
  assignedUsername: string | null;
  discoveredAt: string;
  targetRemediationDate: string | null;
  affectedAssetsCount: number;
  primaryProviderName: string | null;
}

export interface CvssAssessmentDTO {
  id: number;
  vulnerabilityId: number;
  assessedBy: number | null;
  assessedByUsername: string | null;
  cvssVersion: CvssVersion;
  cvssVector: string;
  cvssScore: number;
  severity: CvssSeverity;
  isCurrent: boolean;
  assessedAt: string;
}

export interface RemediationCommentDTO {
  id: number;
  vulnerabilityId: number;
  userId: number;
  username: string;
  commentText: string;
  evidenceUrl: string | null;
  createdAt: string;
}

export interface AuditLogDTO {
  id: number;
  vulnerabilityId: number;
  userId: number;
  username: string;
  actionType: string;
  previousStatus: VulnerabilityStatus | null;
  newStatus: VulnerabilityStatus | null;
  justification: string;
  createdAt: string;
}

export interface VulnerabilityDetailDTO extends VulnerabilitySummaryDTO {
  description: string;
  remediationPlan: string | null;
  resolvedAt: string | null;
  affectedAssets: AssetDTO[];
  assessmentsHistory: CvssAssessmentDTO[];
  comments: RemediationCommentDTO[];
  auditTrail: AuditLogDTO[];
}

export interface VulnerabilityCreateRequest {
  internalCode: string;
  cveId?: string | null;
  title: string;
  description: string;
  cvssVersion: CvssVersion;
  cvssVector: string;
  cvssScore: number;
  severity: CvssSeverity;
  remediationPlan?: string | null;
  assignedTo?: number | null;
  discoveredAt?: string | null;
  targetRemediationDate?: string | null;
  affectedAssetIds: number[];
}

export interface StatusTransitionRequest {
  newStatus: VulnerabilityStatus;
  justification: string;
  commentText?: string | null;
  evidenceUrl?: string | null;
}

export interface CvssAssessmentCreateRequest {
  cvssVersion: CvssVersion;
  cvssVector: string;
  cvssScore: number;
  severity: CvssSeverity;
  justification?: string | null;
}

export interface BatchImportResultDTO {
  jobId: string;
  status: string;
  totalSubmitted: number;
  insertedCount: number;
  rolledBack: boolean;
  workerThreadsUsed: number;
  executionTimeMs: number;
  errors: FieldIssueDTO[];
}

export interface IctProviderDTO {
  id: number;
  providerCode: string;
  name: string;
  providedService: string;
  criticality: ProviderCriticality;
  contractReference: string;
  contractStatus: ContractStatus | string;
  reviewDate: string;
  contactEmail: string;
  countryCode: string;
  slaAvailabilityPct: number;
  managedAssetsCount: number;
  activeCriticalHighVulnsCount: number;
  doraRiskStatus: DoraRiskStatus;
}

export interface IctProviderUpsertRequest {
  providerCode: string;
  name: string;
  providedService: string;
  criticality: ProviderCriticality;
  contractReference: string;
  contractStatus: ContractStatus;
  reviewDate: string;
  contactEmail: string;
  countryCode: string;
  slaAvailabilityPct: number;
}

export interface ProviderFilterParams {
  criticality?: ProviderCriticality | '';
  contractStatus?: ContractStatus | '';
  atRiskOnly?: boolean;
}

export interface ProviderDoraReportDTO {
  provider: IctProviderDTO;
  generatedAt: string;
  doraRiskStatus: DoraRiskStatus;
  riskJustification: string;
  managedAssets: AssetDTO[];
  pendingVulnerabilities: VulnerabilitySummaryDTO[];
}

export interface DashboardSummaryResponse {
  totalVulnerabilities: number;
  openAndPendingCount: number;
  criticalOpenCount: number;
  providersAtRiskCount: number;
  bySeverity: Record<CvssSeverity, number>;
  byStatus: Record<VulnerabilityStatus, number>;
  providersAtRisk: IctProviderDTO[];
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface VulnerabilityFilterParams {
  severity?: CvssSeverity | '';
  status?: VulnerabilityStatus | '';
  assetId?: number;
  providerId?: number;
  assignedTo?: number;
  minScore?: number;
  maxScore?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export type ReportFormat = 'CSV' | 'HTML';

export interface ReportExportParams {
  format: ReportFormat;
  severity?: CvssSeverity | '';
  status?: VulnerabilityStatus | '';
  providerId?: number;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code:
    | 'CVSS_COHERENCE_VIOLATION'
    | 'INVALID_STATE_TRANSITION'
    | 'VALIDATION_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN_ROLE'
    | 'RESOURCE_NOT_FOUND'
    | 'DUPLICATE_RESOURCE'
    | string;
  message: string;
  path: string;
  details?: FieldIssueDTO[];
}
