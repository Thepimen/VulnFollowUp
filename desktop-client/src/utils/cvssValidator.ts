import type { CvssSeverity, CvssVersion } from '../types/api';

export interface CvssValidationResult {
  valid: boolean;
  normalizedScore: number | null;
  expectedSeverity: CvssSeverity | null;
  errorMessage: string | null;
  ruleBroken: 'REQUIRED' | 'PREFIX' | 'RANGE' | 'COHERENCE' | null;
}

export interface CvssPreset {
  label: string;
  version: CvssVersion;
  vector: string;
  score: number;
  severity: CvssSeverity;
}

export const CVSS_PRESETS: CvssPreset[] = [
  {
    label: 'CVSS 3.1 · Crítica (9.8 — RCE Remoto sin auth)',
    version: '3.1',
    vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    score: 9.8,
    severity: 'CRITICAL',
  },
  {
    label: 'CVSS 4.0 · Crítica (9.3 — Explotación remota impacto total)',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N',
    score: 9.3,
    severity: 'CRITICAL',
  },
  {
    label: 'CVSS 3.1 · Alta (7.5 — Denegación de servicio / Exposición)',
    version: '3.1',
    vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',
    score: 7.5,
    severity: 'HIGH',
  },
  {
    label: 'CVSS 4.0 · Media (5.1 — Redirección abierta / SSRF parcial)',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N',
    score: 5.1,
    severity: 'MEDIUM',
  },
  {
    label: 'CVSS 4.0 · Baja (2.6 — Path traversal mitigado)',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
    score: 2.6,
    severity: 'LOW',
  },
];

/**
 * Normalizes a CVSS score to 1 decimal place using half-up rounding,
 * mirroring PostgreSQL NUMERIC(3,1) and backend CvssValidator.java.
 */
export function normalizeCvssScore(score: number): number {
  return Math.round(score * 10 + Number.EPSILON) / 10;
}

/**
 * Maps a normalized CVSS Base score (0.0 - 10.0) to its official qualitative severity.
 */
export function expectedSeverityForScore(score: number): CvssSeverity | null {
  if (!Number.isFinite(score)) return null;
  const normalized = normalizeCvssScore(score);
  if (normalized < 0.0 || normalized > 10.0) return null;
  if (normalized === 0.0) return 'NONE';
  if (normalized <= 3.9) return 'LOW';
  if (normalized <= 6.9) return 'MEDIUM';
  if (normalized <= 8.9) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Validates CVSS Base v3.1 / v4.0 coherence using the exact same 4 rules as
 * backend CvssValidator.java and PostgreSQL CHECK constraints.
 */
export function validateCvssAssessment(
  version: CvssVersion,
  vector: string,
  score: number,
  severity: CvssSeverity
): CvssValidationResult {
  if (!vector || vector.trim().length === 0) {
    return {
      valid: false,
      normalizedScore: Number.isFinite(score) ? normalizeCvssScore(score) : null,
      expectedSeverity: expectedSeverityForScore(score),
      errorMessage: 'El campo cvss_vector de la evaluación CVSS es obligatorio.',
      ruleBroken: 'REQUIRED',
    };
  }

  const expectedPrefix = `CVSS:${version}/`;
  if (!vector.startsWith(expectedPrefix)) {
    return {
      valid: false,
      normalizedScore: Number.isFinite(score) ? normalizeCvssScore(score) : null,
      expectedSeverity: expectedSeverityForScore(score),
      errorMessage: `Incoherencia CVSS: la versión declarada es ${version}, pero el vector debe comenzar por '${expectedPrefix}'.`,
      ruleBroken: 'PREFIX',
    };
  }

  if (!Number.isFinite(score)) {
    return {
      valid: false,
      normalizedScore: null,
      expectedSeverity: null,
      errorMessage: 'El campo cvss_score debe ser un valor numérico entre 0.0 y 10.0.',
      ruleBroken: 'RANGE',
    };
  }

  const normalized = normalizeCvssScore(score);
  if (normalized < 0.0 || normalized > 10.0) {
    return {
      valid: false,
      normalizedScore: normalized,
      expectedSeverity: null,
      errorMessage: `Puntuación CVSS fuera del rango oficial 0.0 a 10.0 (recibido: ${normalized.toFixed(1)}).`,
      ruleBroken: 'RANGE',
    };
  }

  const expected = expectedSeverityForScore(normalized);
  if (expected && severity !== expected) {
    return {
      valid: false,
      normalizedScore: normalized,
      expectedSeverity: expected,
      errorMessage: `Incoherencia CVSS: una nota de ${normalized.toFixed(1)} corresponde a severidad ${expected}, pero se ha seleccionado ${severity}.`,
      ruleBroken: 'COHERENCE',
    };
  }

  return {
    valid: true,
    normalizedScore: normalized,
    expectedSeverity: expected,
    errorMessage: null,
    ruleBroken: null,
  };
}
