import React, { useState } from 'react';
import { Modal } from '../Modal';
import {
  OFFICIAL_ROLLBACK_TEST_BATCH_JSON,
  VALID_SAMPLE_BATCH_JSON,
} from '../../services/demoStore';
import type { BatchImportResultDTO } from '../../types/api';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rawJson: string) => Promise<BatchImportResultDTO>;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [rawJson, setRawJson] = useState(OFFICIAL_ROLLBACK_TEST_BATCH_JSON);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BatchImportResultDTO | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawJson(text);
    setResult(null);
    setRollbackError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setRollbackError(null);

    try {
      JSON.parse(rawJson);
    } catch {
      setRollbackError('El contenido introducido no es un JSON sintácticamente válido.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await onImport(rawJson);
      setResult(response);
    } catch (err) {
      setRollbackError(
        err instanceof Error
          ? err.message
          : 'Error en la importación del lote JSON (transacción revertida).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importación Masiva JSON con Transacción Atómica (ROLLBACK ACID)"
      subtitle="POST /api/vulnerabilities/import · Valida cada registro CVSS v3.1/v4.0; si falla uno, revierte todo el lote (0 registros parciales)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="preset-bar">
          <span className="form-label">Cargar lote de demostración o archivo local:</span>
          <div className="preset-chips">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setRawJson(OFFICIAL_ROLLBACK_TEST_BATCH_JSON);
                setResult(null);
                setRollbackError(null);
              }}
            >
              Lote Oficial Rollback (4 ítems · #4 corrupto CVSS 4.0/3.1)
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setRawJson(VALID_SAMPLE_BATCH_JSON);
                setResult(null);
                setRollbackError(null);
              }}
            >
              Lote Válido (2 CVEs CVSS v3.1 y v4.0)
            </button>
            <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
              Subir archivo .json
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {result && (
          <div className="inline-alert inline-alert-success" role="status">
            <strong>COMMITTED ({result.jobId}):</strong> Se importaron{' '}
            <strong className="mono">{result.insertedCount}</strong> de{' '}
            <strong className="mono">{result.totalSubmitted}</strong> vulnerabilidades en{' '}
            <strong className="mono">{result.executionTimeMs} ms</strong> (hilos:{' '}
            <span className="mono">{result.workerThreadsUsed}</span>).
          </div>
        )}

        {rollbackError && (
          <div className="inline-alert inline-alert-error" role="alert">
            <strong>ROLLBACK TRANSACCIONAL (ACID):</strong> {rollbackError}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="batch-json-textarea" className="form-label">
            Payload JSON del Lote (formato oficial <code>snake_case</code> de <code>data/</code>)
          </label>
          <textarea
            id="batch-json-textarea"
            className="form-input form-textarea mono"
            rows={14}
            spellCheck={false}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cerrar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Validando y ejecutando transacción...' : 'Ejecutar Importación Atómica (POST)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
