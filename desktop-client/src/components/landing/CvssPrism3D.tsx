import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface CvssScenario {
  id: string;
  code: string;
  cve: string;
  title: string;
  version: '3.1' | '4.0';
  vector: string;
  score: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'FAULT';
  provider: string;
  verdict: string;
  isFault: boolean;
  primaryRgb: [number, number, number];
  edgeColor: string;
  accentHex: string;
  spinSpeed: number;
  spikeFactor: number;
}

const SCENARIOS: CvssScenario[] = [
  {
    id: 'vfu-0012',
    code: 'VFU-0012',
    cve: 'CVE-2024-21762',
    title: 'RCE en Pasarela API de Pagos (HostingSur S.L.)',
    version: '3.1',
    vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    score: '9.8',
    severity: 'CRITICAL',
    provider: 'HostingSur S.L. · AST-PAY-008',
    verdict: 'ACEPTADO (201) · BLOQUEO DORA CAP. V ACTIVO',
    isFault: false,
    primaryRgb: [0, 66, 172],
    edgeColor: '#00D3FB',
    accentHex: '#83FD80',
    spinSpeed: 0.015,
    spikeFactor: 1.24,
  },
  {
    id: 'vfu-0003',
    code: 'VFU-0003',
    cve: 'CVE-2024-6387',
    title: 'OpenSSH regreSSHion Race Condition',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N',
    score: '8.1',
    severity: 'HIGH',
    provider: 'CloudScale EU · SRV-PROD-CB01',
    verdict: 'ACEPTADO (201) · ESCALA CVSS 4.0 VERIFICADA',
    isFault: false,
    primaryRgb: [0, 118, 224],
    edgeColor: '#00D3FB',
    accentHex: '#00D3FB',
    spinSpeed: 0.011,
    spikeFactor: 1.08,
  },
  {
    id: 'vfu-0015',
    code: 'VFU-0015',
    cve: 'CVE-2024-22243',
    title: 'Spring Framework URL Open Redirect / SSRF',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N',
    score: '5.1',
    severity: 'MEDIUM',
    provider: 'HostingSur S.L. · AST-PAY-008',
    verdict: 'ACEPTADO (201) · SLA REMEDIACIÓN 30 DÍAS',
    isFault: false,
    primaryRgb: [0, 155, 195],
    edgeColor: '#83FD80',
    accentHex: '#00D3FB',
    spinSpeed: 0.008,
    spikeFactor: 0.94,
  },
  {
    id: 'vfu-0020',
    code: 'VFU-0020',
    cve: 'CVE-2024-38816',
    title: 'Static Resource Path Traversal Mitigado',
    version: '4.0',
    vector: 'CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N',
    score: '2.6',
    severity: 'LOW',
    provider: 'CloudScale EU · SRV-PROD-CB01',
    verdict: 'ACEPTADO (201) · RIESGO RESIDUAL CONTROLADO',
    isFault: false,
    primaryRgb: [16, 132, 92],
    edgeColor: '#83FD80',
    accentHex: '#83FD80',
    spinSpeed: 0.0055,
    spikeFactor: 0.82,
  },
  {
    id: 'vfu-0094-fault',
    code: 'VFU-0094',
    cve: 'CVE-2026-90094',
    title: 'INCOHERENCIA: Versión 4.0 con Vector CVSS:3.1/...',
    version: '4.0',
    vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    score: '9.8',
    severity: 'FAULT',
    provider: 'Test Rollback Transaccional ACID',
    verdict: 'RECHAZADO HTTP 400 · ROLLBACK ATÓMICO (0 FILAS)',
    isFault: true,
    primaryRgb: [190, 18, 60],
    edgeColor: '#FF4D79',
    accentHex: '#FF4D79',
    spinSpeed: 0.024,
    spikeFactor: 1.38,
  },
];

export const CvssPrism3D: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scenarioRef = useRef<CvssScenario>(SCENARIOS[0]!);
  const rotRef = useRef({ rx: 0.35, ry: 0.4, drag: false, lx: 0, ly: 0 });

  const activeScenario = SCENARIOS[activeIndex] ?? SCENARIOS[0]!;
  scenarioRef.current = activeScenario;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let width = 0;
    let height = 0;
    let currentSpike = scenarioRef.current.spikeFactor;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Octahedron + equatorial belt vertices for crisp faceted 3D prism
    const baseVerts = [
      { x: 0, y: -1.35, z: 0 },
      { x: 0, y: 1.35, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0.72, y: -0.58, z: 0.72 },
      { x: -0.72, y: -0.58, z: 0.72 },
      { x: -0.72, y: -0.58, z: -0.72 },
      { x: 0.72, y: -0.58, z: -0.72 },
      { x: 0.72, y: 0.58, z: 0.72 },
      { x: -0.72, y: 0.58, z: 0.72 },
      { x: -0.72, y: 0.58, z: -0.72 },
      { x: 0.72, y: 0.58, z: -0.72 },
    ];

    const prismFaces: [number, number, number][] = [
      [0, 6, 7], [0, 7, 8], [0, 8, 9], [0, 9, 6],
      [6, 2, 3], [7, 3, 4], [8, 4, 5], [9, 5, 2],
      [6, 3, 7], [7, 4, 8], [8, 5, 9], [9, 2, 6],
      [10, 3, 2], [11, 4, 3], [12, 5, 4], [13, 2, 5],
      [10, 11, 3], [11, 12, 4], [12, 13, 5], [13, 10, 2],
      [1, 11, 10], [1, 12, 11], [1, 13, 12], [1, 10, 13],
    ];

    const render = () => {
      const sc = scenarioRef.current;
      const rot = rotRef.current;

      currentSpike += (sc.spikeFactor - currentSpike) * 0.08;
      if (!rot.drag && !prefersReduced) {
        rot.ry += sc.spinSpeed;
        rot.rx = 0.32 + Math.sin(rot.ry * 0.6) * 0.16;
      }

      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.34;
      const fov = 4.6;

      // Subtle architectural blueprint crosshair grid inside canvas
      ctx.strokeStyle = 'rgba(0, 211, 251, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.5, 0);
      ctx.lineTo(width * 0.5, height);
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();

      const transformed = baseVerts.map((v, idx) => {
        const stretch = idx < 2 ? currentSpike : 1 + (currentSpike - 1) * 0.35;
        const px = v.x * stretch;
        const py = v.y * stretch;
        const pz = v.z * stretch;

        const cosX = Math.cos(rot.rx);
        const sinX = Math.sin(rot.rx);
        const y1 = py * cosX - pz * sinX;
        const z1 = py * sinX + pz * cosX;

        const cosY = Math.cos(rot.ry);
        const sinY = Math.sin(rot.ry);
        const x2 = px * cosY + z1 * sinY;
        const z2 = -px * sinY + z1 * cosY;

        return { x: x2, y: y1, z: z2 };
      });

      const projected = transformed.map((v) => {
        const dist = fov / (fov + v.z + 3.8);
        return {
          x: width * 0.5 + v.x * scale * dist,
          y: height * 0.5 + v.y * scale * dist,
          z: v.z,
        };
      });

      const sorted = prismFaces
        .map(([a, b, c]) => {
          const va = transformed[a]!;
          const vb = transformed[b]!;
          const vc = transformed[c]!;
          const avgZ = (va.z + vb.z + vc.z) / 3;
          const ux = vb.x - va.x;
          const uy = vb.y - va.y;
          const uz = vb.z - va.z;
          const vx = vc.x - va.x;
          const vy = vc.y - va.y;
          const vz = vc.z - va.z;
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;
          const len = Math.hypot(nx, ny, nz) || 1;
          const light = Math.max(0.12, (-nx * 0.3 - ny * 0.5 - nz * 0.8) / len);
          return { a, b, c, avgZ, light };
        })
        .sort((f1, f2) => f2.avgZ - f1.avgZ);

      const [br, bg, bb] = sc.primaryRgb;

      for (const f of sorted) {
        const pa = projected[f.a]!;
        const pb = projected[f.b]!;
        const pc = projected[f.c]!;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.lineTo(pc.x, pc.y);
        ctx.closePath();

        const alpha = 0.28 + f.light * 0.52;
        ctx.fillStyle = `rgba(${Math.min(255, Math.round(br + f.light * 40))}, ${Math.min(
          255,
          Math.round(bg + f.light * 90)
        )}, ${Math.min(255, Math.round(bb + f.light * 70))}, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = sc.edgeColor;
        ctx.lineWidth = f.light > 0.65 ? 1.7 : 0.9;
        ctx.stroke();
      }

      // Orbiting telemetry ring around prism
      ctx.beginPath();
      ctx.ellipse(
        width * 0.5,
        height * 0.5,
        scale * 1.48,
        scale * 0.44,
        rot.rx * 0.5,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = sc.isFault
        ? 'rgba(255, 77, 121, 0.7)'
        : 'rgba(131, 253, 128, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="prism-grid">
      {/* Left Interactive Control Deck */}
      <div className="prism-controls">
        <div className="prism-selector-list" role="radiogroup" aria-label="Escenarios CVSS interactivos">
          {SCENARIOS.map((sc, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={sc.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`prism-option ${isSelected ? 'prism-option-active' : ''} ${
                  sc.isFault ? 'prism-option-fault' : ''
                }`}
                onClick={() => setActiveIndex(idx)}
              >
                <div className="prism-option-top mono">
                  <span>{sc.code} · CVSS v{sc.version}</span>
                  <strong>{sc.isFault ? 'HTTP 400' : `${sc.score} ${sc.severity}`}</strong>
                </div>
                <div className="prism-option-title">{sc.title}</div>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Readout */}
        <div
          className={`prism-readout ${activeScenario.isFault ? 'prism-readout-fault' : ''}`}
          role="status"
          aria-live="polite"
        >
          <div className="prism-readout-row mono">
            <span>VECTOR DECLARADO</span>
            <code>{activeScenario.vector}</code>
          </div>
          <div className="prism-readout-row mono">
            <span>CADENA DORA</span>
            <span>{activeScenario.provider}</span>
          </div>
          <div className="prism-verdict mono">
            {activeScenario.verdict}
          </div>
        </div>
      </div>

      {/* Right Interactive 3D Sculptor Canvas */}
      <div className="prism-stage">
        <div className="prism-stage-bar mono">
          <span>PRISMA CVSS 3D // ARRASTRA PARA INSPECCIONAR</span>
          <span
            className="prism-score-pill"
            style={{
              backgroundColor: activeScenario.isFault ? '#FF4D79' : '#83FD80',
              color: '#080B12',
            }}
          >
            {activeScenario.isFault ? 'ROLLBACK' : `SCORE ${activeScenario.score}`}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          className="prism-canvas"
          role="img"
          aria-label={`Prisma 3D interactivo representando ${activeScenario.code} con puntuación ${activeScenario.score}`}
          onPointerDown={(e) => {
            rotRef.current.drag = true;
            rotRef.current.lx = e.clientX;
            rotRef.current.ly = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!rotRef.current.drag) return;
            const dx = e.clientX - rotRef.current.lx;
            const dy = e.clientY - rotRef.current.ly;
            rotRef.current.ry += dx * 0.015;
            rotRef.current.rx += dy * 0.015;
            rotRef.current.lx = e.clientX;
            rotRef.current.ly = e.clientY;
          }}
          onPointerUp={() => {
            rotRef.current.drag = false;
          }}
          onPointerCancel={() => {
            rotRef.current.drag = false;
          }}
        />

        <div className="prism-stage-footer">
          <span className="mono" style={{ fontSize: '0.78rem', color: '#93A2BE' }}>
            Motor Java `CvssValidator` + SQL `CHECK` en 3NF
          </span>
          <Link to="/vulnerabilities" className="brut-link mono">
            PROBAR EN CONSOLA →
          </Link>
        </div>
      </div>
    </div>
  );
};
