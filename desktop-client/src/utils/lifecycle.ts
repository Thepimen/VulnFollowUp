import type { UserRole, VulnerabilityStatus } from '../types/api';

export interface TransitionOption {
  target: VulnerabilityStatus;
  label: string;
  description: string;
  requiresAdmin: boolean;
}

/**
 * Official VulnFollowUp Remediation State Machine (PROJECT_CONTEXT.md §3):
 * ABIERTA -> PENDIENTE DE REMEDIACIÓN -> RESUELTA -> CERRADA
 *                                              \--> ABIERTA (regresión)
 */
export function getAllowedTransitions(
  currentStatus: VulnerabilityStatus
): TransitionOption[] {
  switch (currentStatus) {
    case 'ABIERTA':
      return [
        {
          target: 'PENDIENTE DE REMEDIACIÓN',
          label: 'Programar Remediación (PENDIENTE DE REMEDIACIÓN)',
          description:
            'Se asigna parche o control compensatorio con fecha objetivo SLA.',
          requiresAdmin: false,
        },
      ];
    case 'PENDIENTE DE REMEDIACIÓN':
      return [
        {
          target: 'RESUELTA',
          label: 'Marcar como Resuelta en Staging (RESUELTA)',
          description:
            'Parche desplegado y verificado en entorno de pruebas/staging.',
          requiresAdmin: false,
        },
      ];
    case 'RESUELTA':
      return [
        {
          target: 'CERRADA',
          label: 'Cierre Formal Auditado (CERRADA — Solo ADMIN)',
          description:
            'Cierre definitivo tras verificación de seguridad en producción.',
          requiresAdmin: true,
        },
        {
          target: 'ABIERTA',
          label: 'Reabrir por Regresión (ABIERTA)',
          description:
            'Reapertura por fallo del parche o reaparición de la vulnerabilidad.',
          requiresAdmin: false,
        },
      ];
    case 'CERRADA':
    default:
      return [];
  }
}

export function canUserExecuteTransition(
  role: UserRole,
  targetStatus: VulnerabilityStatus
): boolean {
  if (role === 'VIEWER') return false;
  if (targetStatus === 'CERRADA') return role === 'ADMIN';
  return role === 'ADMIN' || role === 'ANALYST';
}
