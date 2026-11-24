import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import type {
  ContractStatus,
  IctProviderDTO,
  IctProviderUpsertRequest,
  ProviderCriticality,
} from '../../types/api';

interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProvider: IctProviderDTO | null;
  onSubmit: (
    payload: IctProviderUpsertRequest,
    editingId: number | null
  ) => Promise<void>;
}

export const ProviderFormModal: React.FC<ProviderFormModalProps> = ({
  isOpen,
  onClose,
  editingProvider,
  onSubmit,
}) => {
  const [providerCode, setProviderCode] = useState('PROV-006');
  const [name, setName] = useState('');
  const [providedService, setProvidedService] = useState('');
  const [criticality, setCriticality] = useState<ProviderCriticality>('HIGH');
  const [contractReference, setContractReference] = useState('CTR-DORA-2026-NEW06');
  const [contractStatus, setContractStatus] = useState<ContractStatus>('ACTIVE');
  const [reviewDate, setReviewDate] = useState('2026-12-15');
  const [contactEmail, setContactEmail] = useState('');
  const [countryCode, setCountryCode] = useState('ES');
  const [slaAvailabilityPct, setSlaAvailabilityPct] = useState('99.95');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingProvider) {
      setProviderCode(editingProvider.providerCode);
      setName(editingProvider.name);
      setProvidedService(editingProvider.providedService);
      setCriticality(editingProvider.criticality);
      setContractReference(editingProvider.contractReference);
      setContractStatus(editingProvider.contractStatus as ContractStatus);
      setReviewDate(editingProvider.reviewDate);
      setContactEmail(editingProvider.contactEmail);
      setCountryCode(editingProvider.countryCode);
      setSlaAvailabilityPct(String(editingProvider.slaAvailabilityPct));
    } else {
      setProviderCode('PROV-006');
      setName('');
      setProvidedService('');
      setCriticality('HIGH');
      setContractReference('CTR-DORA-2026-NEW06');
      setContractStatus('ACTIVE');
      setReviewDate('2026-12-15');
      setContactEmail('');
      setCountryCode('ES');
      setSlaAvailabilityPct('99.95');
    }
  }, [isOpen, editingProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = providerCode.trim().toUpperCase();
    const country = countryCode.trim().toUpperCase();
    const sla = Number(slaAvailabilityPct);

    if (!/^PROV-[0-9]{3,}$/.test(code)) {
      setError('El código de proveedor debe cumplir el formato PROV-001 (PROV- seguido de al menos 3 dígitos).');
      return;
    }
    if (!/^[A-Z]{2}$/.test(country)) {
      setError('El código de país debe ser ISO 3166-1 alpha-2 (ej. ES, DE, IE, FR).');
      return;
    }
    if (!Number.isFinite(sla) || sla < 0 || sla > 100) {
      setError('El SLA de disponibilidad debe estar entre 0.0 y 100.0%.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          providerCode: code,
          name: name.trim(),
          providedService: providedService.trim(),
          criticality,
          contractReference: contractReference.trim(),
          contractStatus,
          reviewDate,
          contactEmail: contactEmail.trim(),
          countryCode: country,
          slaAvailabilityPct: sla,
        },
        editingProvider ? editingProvider.id : null
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el proveedor TIC.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingProvider
          ? `Editar Proveedor TIC · ${editingProvider.providerCode}`
          : 'Alta de Proveedor TIC Regulado (EU DORA Cap. V)'
      }
      subtitle={
        editingProvider
          ? `PUT /api/providers/${editingProvider.id} · Operación exclusiva del rol ADMIN`
          : 'POST /api/providers · Operación exclusiva del rol ADMIN'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="modal-form">
        {error && (
          <div className="inline-alert inline-alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="prov-code" className="form-label">
              Código Proveedor * <span className="mono">(PROV-XXX)</span>
            </label>
            <input
              id="prov-code"
              type="text"
              className="form-input mono"
              required
              value={providerCode}
              onChange={(e) => setProviderCode(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="prov-name" className="form-label">
              Razón Social del Proveedor TIC *
            </label>
            <input
              id="prov-name"
              type="text"
              className="form-input"
              required
              minLength={2}
              maxLength={120}
              placeholder="Ej. EuroCloud Core Banking S.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="prov-service" className="form-label">
            Servicio TIC Prestado *
          </label>
          <input
            id="prov-service"
            type="text"
            className="form-input"
            required
            minLength={5}
            maxLength={150}
            placeholder="Ej. Procesamiento de pagos SEPA y custodia HSM"
            value={providedService}
            onChange={(e) => setProvidedService(e.target.value)}
          />
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="prov-criticality" className="form-label">
              Criticidad DORA *
            </label>
            <select
              id="prov-criticality"
              className="form-select mono"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as ProviderCriticality)}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="prov-contract-status" className="form-label">
              Estado Contractual *
            </label>
            <select
              id="prov-contract-status"
              className="form-select mono"
              value={contractStatus}
              onChange={(e) => setContractStatus(e.target.value as ContractStatus)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="prov-review-date" className="form-label">
              Próxima Revisión *
            </label>
            <input
              id="prov-review-date"
              type="date"
              className="form-input mono"
              required
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="prov-contract-ref" className="form-label">
              Referencia de Contrato *
            </label>
            <input
              id="prov-contract-ref"
              type="text"
              className="form-input mono"
              required
              maxLength={100}
              value={contractReference}
              onChange={(e) => setContractReference(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="prov-email" className="form-label">
              Email de Seguridad / DORA *
            </label>
            <input
              id="prov-email"
              type="email"
              className="form-input mono"
              required
              maxLength={120}
              placeholder="dora-security@proveedor.eu"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="prov-country" className="form-label">
              País Sede (ISO-2) *
            </label>
            <input
              id="prov-country"
              type="text"
              className="form-input mono"
              required
              maxLength={2}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-field">
            <label htmlFor="prov-sla" className="form-label">
              SLA Disponibilidad (%) *
            </label>
            <input
              id="prov-sla"
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="form-input mono"
              required
              value={slaAvailabilityPct}
              onChange={(e) => setSlaAvailabilityPct(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? 'Guardando proveedor...'
              : editingProvider
                ? 'Actualizar Proveedor (PUT)'
                : 'Registrar Proveedor (POST)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
