import React, { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import type {
  AssetCreateRequest,
  AssetCriticality,
  AssetEnvironment,
  AssetType,
  IctProviderDTO,
} from '../../types/api';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: IctProviderDTO[];
  onSubmit: (payload: AssetCreateRequest) => Promise<void>;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  providers,
  onSubmit,
}) => {
  const [assetCode, setAssetCode] = useState('SRV-PROD-NEW01');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('API_SERVICE');
  const [criticality, setCriticality] = useState<AssetCriticality>('HIGH');
  const [environment, setEnvironment] = useState<AssetEnvironment>('PRODUCTION');
  const [ownerDepartment, setOwnerDepartment] = useState('Arquitectura y Seguridad TI');
  const [ipAddress, setIpAddress] = useState('10.100.20.15');
  const [operatingSystem, setOperatingSystem] = useState('Debian 12 Bookworm');
  const [providerId, setProviderId] = useState<number>(providers[0]?.id ?? 5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (providers.length > 0 && !providers.some((p) => p.id === providerId)) {
        setProviderId(providers[0].id);
      }
    }
  }, [isOpen, providers, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[A-Z0-9-]+$/.test(assetCode.trim().toUpperCase())) {
      setError('El código de activo solo admite mayúsculas, números y guiones (ej. SRV-PROD-009).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        assetCode: assetCode.trim().toUpperCase(),
        name: name.trim(),
        assetType,
        criticality,
        environment,
        ownerDepartment: ownerDepartment.trim(),
        ipAddress: ipAddress.trim() || null,
        operatingSystem: operatingSystem.trim() || null,
        providerId,
      });
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el activo tecnológico.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nuevo Activo Tecnológico"
      subtitle="POST /api/assets · Vinculación 1:N con Proveedor TIC regulado bajo EU DORA"
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
            <label htmlFor="asset-code" className="form-label">
              Código Único * <span className="mono">(^[A-Z0-9-]+$)</span>
            </label>
            <input
              id="asset-code"
              type="text"
              className="form-input mono"
              required
              minLength={3}
              maxLength={40}
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="asset-name" className="form-label">
              Nombre del Activo *
            </label>
            <input
              id="asset-name"
              type="text"
              className="form-input"
              required
              minLength={2}
              maxLength={120}
              placeholder="Ej. Pasarela Instant Payments SEPA"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="asset-type" className="form-label">
              Tipo de Activo *
            </label>
            <select
              id="asset-type"
              className="form-select mono"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
            >
              <option value="API_SERVICE">API_SERVICE</option>
              <option value="APPLICATION_SERVER">APPLICATION_SERVER</option>
              <option value="API_GATEWAY">API_GATEWAY</option>
              <option value="WEB_SERVER">WEB_SERVER</option>
              <option value="DATABASE">DATABASE</option>
              <option value="NETWORK_DEVICE">NETWORK_DEVICE</option>
              <option value="BUILD_SERVER">BUILD_SERVER</option>
              <option value="IDENTITY_PROVIDER">IDENTITY_PROVIDER</option>
              <option value="ENDPOINT">ENDPOINT</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="asset-criticality" className="form-label">
              Criticidad DORA *
            </label>
            <select
              id="asset-criticality"
              className="form-select mono"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as AssetCriticality)}
            >
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="asset-env" className="form-label">
              Entorno *
            </label>
            <select
              id="asset-env"
              className="form-select mono"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as AssetEnvironment)}
            >
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="STAGING">STAGING</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="DR">DR</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="asset-provider" className="form-label">
            Proveedor TIC Asociado (DORA Cap. V) *
          </label>
          <select
            id="asset-provider"
            className="form-select"
            value={providerId}
            onChange={(e) => setProviderId(Number(e.target.value))}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.providerCode} · {p.name} ({p.criticality})
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="asset-dept" className="form-label">
              Departamento Propietario *
            </label>
            <input
              id="asset-dept"
              type="text"
              className="form-input"
              required
              minLength={2}
              maxLength={100}
              value={ownerDepartment}
              onChange={(e) => setOwnerDepartment(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="asset-ip" className="form-label">
              Dirección IP
            </label>
            <input
              id="asset-ip"
              type="text"
              className="form-input mono"
              maxLength={45}
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="asset-os" className="form-label">
              Sistema Operativo / Runtime
            </label>
            <input
              id="asset-os"
              type="text"
              className="form-input"
              maxLength={80}
              value={operatingSystem}
              onChange={(e) => setOperatingSystem(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Registrando activo...' : 'Guardar Activo (POST)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
