import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const IsometricVaultStage: React.FC = () => {
  const [tilt, setTilt] = useState({ rx: 8, ry: -10 });
  const [activeStage, setActiveStage] = useState<number>(1);

  const lifecycleSteps = [
    { name: 'ABIERTA', owner: 'analyst_soc', tag: 'DETECCIÓN' },
    { name: 'PENDIENTE', owner: 'analyst_soc', tag: 'SLA PARCHE' },
    { name: 'RESUELTA', owner: 'analyst_appsec', tag: 'STAGING OK' },
    { name: 'CERRADA', owner: 'admin_dora', tag: 'SOLO ADMIN' },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: -ny * 16,
      ry: nx * 20,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 8, ry: -10 });
  };

  return (
    <div
      className="iso-stage-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="iso-stage-plane"
        style={{
          transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
        }}
      >
        {/* Left Floating 3D Card — HostingSur DORA Supply Chain Alert */}
        <article className="iso-card iso-card-left">
          <div className="iso-card-bar mono">
            <span>PROV-005 · DORA CAP. V</span>
            <span className="iso-pill-jade">AT_RISK</span>
          </div>
          <h3 className="iso-card-title">HostingSur S.L.</h3>
          <p className="iso-card-copy">
            Activo crítico <strong>AST-PAY-008 (API de pagos)</strong> vinculado a{' '}
            <code className="mono">VFU-0012</code> (CVSS 9.8). Revisión contractual de marzo bloqueada hasta remediación.
          </p>
          <div className="iso-metric-pair mono">
            <div>
              <span>SLA CONTRATO</span>
              <strong>99.95%</strong>
            </div>
            <div>
              <span>CRÍTICAS ACTIVAS</span>
              <strong style={{ color: '#00D3FB' }}>02</strong>
            </div>
          </div>
        </article>

        {/* Center Floating 3D Obsidian Mobile Frame (Inspired by Reference Image 2) */}
        <article className="iso-phone-frame">
          <div className="iso-phone-notch" aria-hidden="true" />
          <div className="iso-phone-header mono">
            <span>ANDROID ROOM OFFLINE</span>
            <span className="iso-dot-jade">SYNC OK</span>
          </div>

          <div className="iso-phone-ring-wrap">
            <svg viewBox="0 0 120 120" className="iso-ring-svg" aria-hidden="true">
              <circle cx="60" cy="60" r="46" fill="none" stroke="#1A243B" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#0042AC"
                strokeWidth="10"
                strokeDasharray="289"
                strokeDashoffset="72"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#00D3FB"
                strokeWidth="10"
                strokeDasharray="289"
                strokeDashoffset="195"
                transform="rotate(140 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="#83FD80"
                strokeWidth="10"
                strokeDasharray="289"
                strokeDashoffset="245"
                transform="rotate(245 60 60)"
              />
            </svg>
            <div className="iso-ring-center">
              <strong className="mono">9.8</strong>
              <span className="mono">VFU-0012</span>
            </div>
          </div>

          <div className="iso-phone-list mono">
            <div className="iso-phone-row">
              <span>VFU-0012 · RCE Pagos</span>
              <span style={{ color: '#00D3FB' }}>9.8</span>
            </div>
            <div className="iso-phone-row">
              <span>VFU-0002 · PAN-OS</span>
              <span style={{ color: '#00D3FB' }}>10.0</span>
            </div>
            <div className="iso-phone-row">
              <span>VFU-0010 · runc Escape</span>
              <span style={{ color: '#83FD80' }}>8.6</span>
            </div>
          </div>

          <Link to="/providers" className="iso-phone-cta mono">
            AUDITAR CADENA DORA →
          </Link>
        </article>

        {/* Right Top 3D Card — Interactive Lifecycle Audit Pipeline */}
        <article className="iso-card iso-card-right-top">
          <div className="iso-card-bar mono">
            <span>AUDIT_LOGS INMUTABLE</span>
            <span>4 ESTADOS</span>
          </div>
          <div className="iso-steps-grid">
            {lifecycleSteps.map((step, idx) => (
              <button
                key={step.name}
                type="button"
                className={`iso-step-btn mono ${activeStage === idx ? 'iso-step-active' : ''}`}
                onClick={() => setActiveStage(idx)}
              >
                <span>{step.name}</span>
                <small>{step.tag}</small>
              </button>
            ))}
          </div>
          <p className="iso-card-foot mono">
            Actor autorizado: <strong>{lifecycleSteps[activeStage]?.owner}</strong> · Registro firmado en PostgreSQL
          </p>
        </article>

        {/* Right Bottom 3D Card — PSP Concurrency & ProcessBuilder */}
        <article className="iso-card iso-card-right-bottom">
          <div className="iso-card-bar mono">
            <span>JAVA 21 PSP ENGINE</span>
            <span style={{ color: '#83FD80' }}>20 / 20 TESTS PASS</span>
          </div>
          <div className="iso-psp-grid mono">
            <div>
              <strong>32</strong>
              <span>HILOS ESTRÉS</span>
            </div>
            <div>
              <strong>0</strong>
              <span>RACE CONDITIONS</span>
            </div>
            <div>
              <strong>90 KB</strong>
              <span>GREEN BUNDLE</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
