export interface ParsedCvssMetric {
  code: string;
  label: string;
  value: string;
  riskTone: 'high' | 'medium' | 'low';
}

const METRIC_LABELS: Record<string, string> = {
  AV: 'Vector de Ataque',
  AC: 'Complejidad',
  AT: 'Requisitos Previos',
  PR: 'Privilegios',
  UI: 'Interacción Usuario',
  S: 'Alcance (Scope)',
  C: 'Confidencialidad',
  I: 'Integridad',
  A: 'Disponibilidad',
  VC: 'Confidencialidad (Sist.)',
  VI: 'Integridad (Sist.)',
  VA: 'Disponibilidad (Sist.)',
  SC: 'Confidencialidad (Subs.)',
  SI: 'Integridad (Subs.)',
  SA: 'Disponibilidad (Subs.)',
};

const VALUE_MAP: Record<string, Record<string, { text: string; tone: 'high' | 'medium' | 'low' }>> = {
  AV: {
    N: { text: 'Red (Remoto)', tone: 'high' },
    A: { text: 'Red Adyacente', tone: 'medium' },
    L: { text: 'Acceso Local', tone: 'medium' },
    P: { text: 'Acceso Físico', tone: 'low' },
  },
  AC: {
    L: { text: 'Baja (Explotable)', tone: 'high' },
    H: { text: 'Alta (Compleja)', tone: 'low' },
  },
  AT: {
    N: { text: 'Ninguno', tone: 'high' },
    P: { text: 'Presente', tone: 'low' },
  },
  PR: {
    N: { text: 'Ninguno (Anónimo)', tone: 'high' },
    L: { text: 'Bajos', tone: 'medium' },
    H: { text: 'Altos (Admin)', tone: 'low' },
  },
  UI: {
    N: { text: 'Ninguna (0-Click)', tone: 'high' },
    P: { text: 'Pasiva', tone: 'medium' },
    R: { text: 'Requerida', tone: 'low' },
    A: { text: 'Activa', tone: 'low' },
  },
  S: {
    C: { text: 'Modificado (Escala)', tone: 'high' },
    U: { text: 'Sin cambio', tone: 'low' },
  },
  IMPACT: {
    H: { text: 'Alto', tone: 'high' },
    L: { text: 'Bajo', tone: 'medium' },
    N: { text: 'Ninguno', tone: 'low' },
  },
};

const IMPACT_KEYS = new Set(['C', 'I', 'A', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA']);

/**
 * Translates an official CVSS v3.1 or v4.0 vector string into human-readable Spanish
 * security metrics for rapid comprehension by CISOs, analysts, and auditors.
 */
export function parseCvssVectorToHuman(vector: string): ParsedCvssMetric[] {
  if (!vector) return [];
  const parts = vector.trim().split('/');
  const results: ParsedCvssMetric[] = [];

  for (const part of parts) {
    if (part.startsWith('CVSS:')) continue;
    const [key, val] = part.split(':');
    if (!key || !val) continue;

    const label = METRIC_LABELS[key] ?? key;
    const table = IMPACT_KEYS.has(key) ? VALUE_MAP.IMPACT : VALUE_MAP[key];
    const resolved = table?.[val];

    results.push({
      code: `${key}:${val}`,
      label,
      value: resolved ? resolved.text : val,
      riskTone: resolved ? resolved.tone : 'medium',
    });
  }

  return results;
}
