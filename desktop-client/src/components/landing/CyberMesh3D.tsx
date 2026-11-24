import React, { useEffect, useRef, useState } from 'react';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface CyberMesh3DProps {
  className?: string;
}

const PHI = (1 + Math.sqrt(5)) / 2;

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function buildIcosahedron(): { vertices: Vec3[]; faces: [number, number, number][]; edges: [number, number][] } {
  const raw: Vec3[] = [
    { x: -1, y: PHI, z: 0 },
    { x: 1, y: PHI, z: 0 },
    { x: -1, y: -PHI, z: 0 },
    { x: 1, y: -PHI, z: 0 },
    { x: 0, y: -1, z: PHI },
    { x: 0, y: 1, z: PHI },
    { x: 0, y: -1, z: -PHI },
    { x: 0, y: 1, z: -PHI },
    { x: PHI, y: 0, z: -1 },
    { x: PHI, y: 0, z: 1 },
    { x: -PHI, y: 0, z: -1 },
    { x: -PHI, y: 0, z: 1 },
  ].map(normalize);

  const faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of faces) {
    const pairs: [number, number][] = [
      [a, b],
      [b, c],
      [c, a],
    ];
    for (const [u, v] of pairs) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([u, v]);
      }
    }
  }

  return { vertices: raw, faces, edges };
}

function rotatePoint(p: Vec3, rx: number, ry: number, rz: number): Vec3 {
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = p.y * cosX - p.z * sinX;
  const z1 = p.y * sinX + p.z * cosX;

  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x2 = p.x * cosY + z1 * sinY;
  const z2 = -p.x * sinY + z1 * cosY;

  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  return {
    x: x2 * cosZ - y1 * sinZ,
    y: x2 * sinZ + y1 * cosZ,
    z: z2,
  };
}

export const CyberMesh3D: React.FC<CyberMesh3DProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [telemetry, setTelemetry] = useState({ rx: 24, ry: 38, pulses: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const interactionRef = useRef({
    rotX: 0.42,
    rotY: 0.65,
    velX: 0.0022,
    velY: 0.0052,
    targetTiltX: 0,
    targetTiltY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pulseProgress: 1,
    pulseCount: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const mesh = buildIcosahedron();
    const outerNodes: Vec3[] = Array.from({ length: 42 }, (_, i) => {
      const y = 1 - (i / 41) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963229728653;
      return {
        x: Math.cos(theta) * radiusAtY * 1.48,
        y: y * 1.48,
        z: Math.sin(theta) * radiusAtY * 1.48,
      };
    });

    let rafId = 0;
    let frame = 0;
    let width = 0;
    let height = 0;

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

    const project = (v: Vec3, scale: number, fov: number) => {
      const dist = fov / (fov + v.z + 3.6);
      return {
        x: width * 0.5 + v.x * scale * dist,
        y: height * 0.5 + v.y * scale * dist,
        scale: dist,
        z: v.z,
      };
    };

    const render = () => {
      frame += 1;
      const st = interactionRef.current;

      if (!st.dragging && !prefersReducedMotion) {
        st.rotX += st.velX + (st.targetTiltX - st.rotX) * 0.015;
        st.rotY += st.velY + (st.targetTiltY - st.rotY) * 0.015;
        st.velX = st.velX * 0.96 + 0.0018 * 0.04;
        st.velY = st.velY * 0.96 + 0.0046 * 0.04;
      }

      if (st.pulseProgress < 1) {
        st.pulseProgress = Math.min(1, st.pulseProgress + 0.024);
      }

      ctx.clearRect(0, 0, width, height);

      const baseScale = Math.min(width, height) * 0.44;
      const fov = 4.2;
      const pulseBoost =
        st.pulseProgress < 1
          ? Math.sin(st.pulseProgress * Math.PI) * 0.22
          : 0;

      // 1. Subtle 3D Gyroscopic Telemetry Rings (#0042AC & #00D3FB)
      const ringConfigs = [
        { radius: 1.38, tiltX: 0.72, tiltZ: 0.25, color: 'rgba(0, 211, 251, 0.34)', speed: 0.6 },
        { radius: 1.62, tiltX: -0.58, tiltZ: -0.4, color: 'rgba(0, 66, 172, 0.55)', speed: -0.42 },
        { radius: 1.82, tiltX: 1.05, tiltZ: 0.1, color: 'rgba(131, 253, 128, 0.22)', speed: 0.3 },
      ];

      ringConfigs.forEach((ring, rIdx) => {
        ctx.beginPath();
        const segments = 72;
        for (let i = 0; i <= segments; i += 1) {
          const a = (i / segments) * Math.PI * 2;
          const p0: Vec3 = {
            x: Math.cos(a) * ring.radius * (1 + pulseBoost * 0.5),
            y: Math.sin(a) * ring.radius * (1 + pulseBoost * 0.5),
            z: 0,
          };
          const p1 = rotatePoint(
            p0,
            ring.tiltX + st.rotX * 0.55,
            st.rotY * ring.speed + frame * (prefersReducedMotion ? 0 : 0.002 * ring.speed),
            ring.tiltZ
          );
          const proj = project(p1, baseScale, fov);
          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = rIdx === 0 ? 1.5 : 1;
        ctx.stroke();
      });

      // 2. Orbiting Outer Shield Nodes (#00D3FB & #83FD80)
      const projectedOuter = outerNodes.map((node, idx) => {
        const expanded = {
          x: node.x * (1 + pulseBoost * 0.8),
          y: node.y * (1 + pulseBoost * 0.8),
          z: node.z * (1 + pulseBoost * 0.8),
        };
        const r = rotatePoint(expanded, -st.rotX * 0.45, st.rotY * 0.65, 0.12);
        return { ...project(r, baseScale, fov), idx };
      });

      for (let i = 0; i < projectedOuter.length; i += 1) {
        const a = projectedOuter[i];
        const next = projectedOuter[(i + 5) % projectedOuter.length];
        if (!a || !next) continue;
        const depthAlpha = Math.max(0.06, Math.min(0.42, (2.2 - a.z) * 0.14));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = `rgba(0, 211, 251, ${depthAlpha * 0.55})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();

        const isJadeNode = a.idx % 7 === 0;
        ctx.beginPath();
        ctx.arc(a.x, a.y, isJadeNode ? 2.6 * a.scale : 1.7 * a.scale, 0, Math.PI * 2);
        ctx.fillStyle = isJadeNode
          ? `rgba(131, 253, 128, ${Math.min(1, depthAlpha * 2.4)})`
          : `rgba(0, 211, 251, ${Math.min(0.95, depthAlpha * 2.0)})`;
        ctx.fill();
      }

      // 3. Central 3D Faceted Sapphire Vault Icosahedron
      const transformedVertices = mesh.vertices.map((v) =>
        rotatePoint(
          {
            x: v.x * (1 + pulseBoost),
            y: v.y * (1 + pulseBoost),
            z: v.z * (1 + pulseBoost),
          },
          st.rotX,
          st.rotY,
          0.18
        )
      );

      const projectedVertices = transformedVertices.map((v) =>
        project(v, baseScale, fov)
      );

      // Depth-sort faces back-to-front
      const sortedFaces = mesh.faces
        .map(([a, b, c]) => {
          const va = transformedVertices[a];
          const vb = transformedVertices[b];
          const vc = transformedVertices[c];
          if (!va || !vb || !vc) return null;
          const avgZ = (va.z + vb.z + vc.z) / 3;

          // Surface normal for directional shading
          const ux = vb.x - va.x;
          const uy = vb.y - va.y;
          const uz = vb.z - va.z;
          const vx = vc.x - va.x;
          const vy = vc.y - va.y;
          const vz = vc.z - va.z;
          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;
          const nLen = Math.hypot(nx, ny, nz) || 1;
          const lightDot = Math.max(0, (-nx * 0.45 - ny * 0.55 - nz * 0.7) / nLen);

          return { indices: [a, b, c] as [number, number, number], avgZ, lightDot };
        })
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .sort((f1, f2) => f2.avgZ - f1.avgZ);

      for (const face of sortedFaces) {
        const [a, b, c] = face.indices;
        const pa = projectedVertices[a];
        const pb = projectedVertices[b];
        const pc = projectedVertices[c];
        if (!pa || !pb || !pc) continue;

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.lineTo(pc.x, pc.y);
        ctx.closePath();

        // Sapphire Blue #0042AC illuminated toward Ocean Blue #00D3FB
        const r = Math.round(0 + face.lightDot * 12);
        const g = Math.round(52 + face.lightDot * 135);
        const bVal = Math.round(145 + face.lightDot * 105);
        const alpha = 0.24 + face.lightDot * 0.48;
        ctx.fillStyle = `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
        ctx.fill();

        ctx.strokeStyle =
          face.lightDot > 0.62
            ? 'rgba(0, 211, 251, 0.92)'
            : 'rgba(0, 120, 220, 0.52)';
        ctx.lineWidth = face.lightDot > 0.62 ? 1.6 : 1;
        ctx.stroke();
      }

      // 4. Inner Glowing Neon Jade Security Core
      const coreRadius = baseScale * (0.28 + pulseBoost * 0.45);
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, coreRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(131, 253, 128, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, coreRadius * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = '#83FD80';
      ctx.fill();

      // 5. Crisp Vertex Nodes + Shockwave Ring
      projectedVertices.forEach((pv, idx) => {
        const isFront = pv.z < 0.2;
        ctx.beginPath();
        ctx.arc(pv.x, pv.y, isFront ? 3.8 : 2.1, 0, Math.PI * 2);
        ctx.fillStyle = idx % 3 === 0 ? '#83FD80' : '#00D3FB';
        ctx.fill();
      });

      if (st.pulseProgress < 1) {
        const shockRadius = baseScale * (0.4 + st.pulseProgress * 1.9);
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(131, 253, 128, ${(1 - st.pulseProgress) * 0.9})`;
        ctx.lineWidth = 2.5 * (1 - st.pulseProgress) + 0.5;
        ctx.stroke();
      }

      if (frame % 14 === 0) {
        setTelemetry({
          rx: Math.round(((st.rotX * 180) / Math.PI) % 360),
          ry: Math.round(((st.rotY * 180) / Math.PI) % 360),
          pulses: st.pulseCount,
        });
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = interactionRef.current;
    st.dragging = true;
    st.lastX = e.clientX;
    st.lastY = e.clientY;
    st.pulseProgress = 0;
    st.pulseCount += 1;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = interactionRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    if (st.dragging) {
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.rotY += dx * 0.011;
      st.rotX += dy * 0.011;
      st.velY = dx * 0.0022;
      st.velX = dy * 0.0022;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
    } else {
      st.targetTiltY = nx * 1.4;
      st.targetTiltX = ny * 1.1;
    }
  };

  const handlePointerUp = () => {
    interactionRef.current.dragging = false;
    setIsDragging(false);
  };

  return (
    <div className={`mesh3d-frame ${className}`}>
      <div className="mesh3d-hud-top mono" aria-hidden="true">
        <span>[ DORA_VAULT_CORE.3D ]</span>
        <span>
          RX:{String(telemetry.rx).padStart(4, ' ')}° · RY:{String(telemetry.ry).padStart(4, ' ')}°
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className={`mesh3d-canvas ${isDragging ? 'mesh3d-grabbing' : ''}`}
        aria-label="Malla geodésica 3D interactiva del núcleo defensivo VulnFollowUp. Arrastra para rotar o haz clic para emitir un pulso de auditoría."
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className="mesh3d-hud-bottom mono">
        <span>ARRASTRA PARA ROTAR 360° · CLIC PARA PULSO DORA</span>
        <span className="mesh3d-pulse-tag">PULSOS: {telemetry.pulses}</span>
      </div>
    </div>
  );
};
