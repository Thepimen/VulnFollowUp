import type {
  ApiErrorResponse,
  AssetCreateRequest,
  AssetDTO,
  AssetFilterParams,
  BatchImportResultDTO,
  CvssAssessmentCreateRequest,
  CvssAssessmentDTO,
  DashboardSummaryResponse,
  FieldIssueDTO,
  HealthResponse,
  IctProviderDTO,
  IctProviderUpsertRequest,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  ProviderDoraReportDTO,
  ProviderFilterParams,
  ReportExportParams,
  StatusTransitionRequest,
  UserSummaryDTO,
  VulnerabilityCreateRequest,
  VulnerabilityDetailDTO,
  VulnerabilityFilterParams,
  VulnerabilitySummaryDTO,
} from '../types/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const TOKEN_STORAGE_KEY = 'vulnfollowup_jwt_token';
const USER_STORAGE_KEY = 'vulnfollowup_auth_user';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: FieldIssueDTO[];
  public readonly isNetworkError: boolean;

  constructor(options: {
    message: string;
    status: number;
    code: string;
    details?: FieldIssueDTO[];
    isNetworkError?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? [];
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors in restricted contexts
  }
}

export function getStoredUser(): UserSummaryDTO | null {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSummaryDTO;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserSummaryDTO | null): void {
  try {
    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function parseErrorResponse(response: Response): Promise<ApiClientError> {
  const fallbackMessage = `Error HTTP ${response.status} (${response.statusText || 'Error de servidor'})`;
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;
    return new ApiClientError({
      message: body.message || fallbackMessage,
      status: body.status ?? response.status,
      code: body.code || `HTTP_${response.status}`,
      details: body.details ?? [],
    });
  } catch {
    return new ApiClientError({
      message: fallbackMessage,
      status: response.status,
      code: `HTTP_${response.status}`,
    });
  }
}

export async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError({
      message: `No se pudo conectar con el backend Spring Boot en ${API_BASE_URL}.`,
      status: 0,
      code: 'NETWORK_UNREACHABLE',
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestText(
  endpoint: string,
  accept: string,
  options: RequestInit = {}
): Promise<string> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', accept);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError({
      message: `No se pudo conectar con el backend Spring Boot en ${API_BASE_URL}.`,
      status: 0,
      code: 'NETWORK_UNREACHABLE',
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return await response.text();
}

function buildQuery(params: object): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const encoded = query.toString();
  return encoded ? `?${encoded}` : '';
}

export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export const apiService = {
  checkHealth: async (): Promise<HealthResponse> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as HealthResponse;
    } finally {
      window.clearTimeout(timeout);
    }
  },

  login: (payload: LoginRequest): Promise<LoginResponse> =>
    requestJson<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDashboardSummary: (): Promise<DashboardSummaryResponse> =>
    requestJson<DashboardSummaryResponse>('/api/dashboard/summary'),

  getVulnerabilities: (
    params: VulnerabilityFilterParams
  ): Promise<PaginatedResponse<VulnerabilitySummaryDTO>> =>
    requestJson<PaginatedResponse<VulnerabilitySummaryDTO>>(
      `/api/vulnerabilities${buildQuery(params)}`
    ),

  getVulnerabilityById: (id: number): Promise<VulnerabilityDetailDTO> =>
    requestJson<VulnerabilityDetailDTO>(`/api/vulnerabilities/${id}`),

  createVulnerability: (
    payload: VulnerabilityCreateRequest
  ): Promise<VulnerabilityDetailDTO> =>
    requestJson<VulnerabilityDetailDTO>('/api/vulnerabilities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateVulnerabilityStatus: (
    id: number,
    payload: StatusTransitionRequest
  ): Promise<VulnerabilityDetailDTO> =>
    requestJson<VulnerabilityDetailDTO>(`/api/vulnerabilities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  addCvssAssessment: (
    id: number,
    payload: CvssAssessmentCreateRequest
  ): Promise<CvssAssessmentDTO> =>
    requestJson<CvssAssessmentDTO>(`/api/vulnerabilities/${id}/assessment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  importVulnerabilitiesBatch: (
    rawJsonString: string
  ): Promise<BatchImportResultDTO> =>
    requestJson<BatchImportResultDTO>('/api/vulnerabilities/import', {
      method: 'POST',
      body: rawJsonString,
    }),

  deleteVulnerability: (id: number): Promise<void> =>
    requestJson<void>(`/api/vulnerabilities/${id}`, {
      method: 'DELETE',
    }),

  getAssets: (
    params: AssetFilterParams = {}
  ): Promise<PaginatedResponse<AssetDTO>> =>
    requestJson<PaginatedResponse<AssetDTO>>(
      `/api/assets${buildQuery({ page: 0, size: 10, ...params })}`
    ),

  createAsset: (payload: AssetCreateRequest): Promise<AssetDTO> =>
    requestJson<AssetDTO>('/api/assets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProviders: (
    params: ProviderFilterParams = {}
  ): Promise<IctProviderDTO[]> =>
    requestJson<IctProviderDTO[]>(`/api/providers${buildQuery(params)}`),

  createProvider: (
    payload: IctProviderUpsertRequest
  ): Promise<IctProviderDTO> =>
    requestJson<IctProviderDTO>('/api/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProvider: (
    id: number,
    payload: IctProviderUpsertRequest
  ): Promise<IctProviderDTO> =>
    requestJson<IctProviderDTO>(`/api/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getProviderDoraReport: (id: number): Promise<ProviderDoraReportDTO> =>
    requestJson<ProviderDoraReportDTO>(`/api/providers/${id}/report`),

  exportReport: (params: ReportExportParams): Promise<string> => {
    const accept = params.format === 'HTML' ? 'text/html' : 'text/csv';
    return requestText(`/api/reports/export${buildQuery(params)}`, accept);
  },
};
