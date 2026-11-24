import React from 'react';
import { useToast, type ToastVariant } from '../context/ToastContext';

const VARIANT_META: Record<ToastVariant, { prefix: string; className: string }> = {
  success: { prefix: 'OK', className: 'toast-item toast-success' },
  error: { prefix: 'ERR', className: 'toast-item toast-error' },
  warning: { prefix: 'WARN', className: 'toast-item toast-warning' },
  info: { prefix: 'INFO', className: 'toast-item toast-info' },
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <aside
      className="toast-stack"
      aria-label="Notificaciones del sistema"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const meta = VARIANT_META[toast.variant];
        return (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={meta.className}
          >
            <div className="toast-content">
              <div className="toast-header">
                <span className="toast-code mono">{meta.prefix}</span>
                <strong>{toast.title}</strong>
              </div>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="btn toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label={`Cerrar notificación: ${toast.title}`}
            >
              ×
            </button>
          </div>
        );
      })}
    </aside>
  );
};
