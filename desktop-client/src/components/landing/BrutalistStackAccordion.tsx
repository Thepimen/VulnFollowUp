import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface StackBlade {
  code: string;
  module: string;
  title: string;
  summary: string;
  specs: string[];
  route: string;
  cta: string;
  accent: 'sapphire' | 'ocean' | 'jade';
}

const BLADES: StackBlade[] = [
  {
    code: 'AD // 3NF',
    module: 'POSTGRESQL 16',
    title: 'PERSISTENCIA BLINDADA EN 3NF Y ROLLBACK ACID',
    summary:
      'Seis tablas normalizadas con relación N:M entre vulnerabilidades y activos, restricciones CHECK para coherencia CVSS v3.1/v4.0 e índices compuestos orientados a paginación sostenible.',
    specs: [
      'database/schema/01_schema.sql',
      '20 CVEs semilla + caso HostingSur S.L. / VFU-0012',
      'Importación masiva JSON todo-o-nada (0 registros parciales)',
    ],
    route: '/vulnerabilities',
    cta: 'PROBAR ROLLBACK EN CONSOLA',
    accent: 'sapphire',
  },
  {
    code: 'PSP // JAVA 21',
    module: 'SPRING BOOT 3.3',
    title: 'CONCURRENCIA SEGURA, JWT RFC 7519 Y PROCESSBUILDER',
    summary:
      'API REST stateless con hash BCrypt coste 12, matriz RBAC estricta (ADMIN, ANALYST, VIEWER), pool ExecutorService con ReentrantLock verificado a 32 hilos y exportación CSV/HTML mediante subproceso OS.',
    specs: [
      'JwtTokenService HS256 + SecurityConfig stateless',
      'PspConcurrencyAndProcessTest: 20/20 JUnit en verde',
      'GET /api/reports/export sin interpolación de shell',
    ],
    route: '/login',
    cta: 'AUTENTICAR SESIÓN JWT',
    accent: 'ocean',
  },
  {
    code: 'DI // SGE',
    module: 'REACT + TS SPA',
    title: 'GOBERNANZA DORA Y ACCESIBILIDAD WCAG 2.1 AA',
    summary:
      'Interfaz modular de alto contraste que nunca depende solo del color: insignias geométricas por severidad, navegación íntegra por teclado, modales ARIA y semáforo contractual para proveedores TIC.',
    specs: [
      'Contraste >= 7.2:1 en modo oscuro OLED y papel claro',
      '5 modales operativos: Alta CVSS, Auditoría, Rollback, Activos y SGE',
      'Bundle de producción de 90 KB gzip (Green Software)',
    ],
    route: '/providers',
    cta: 'INSPECCIONAR MÓDULO DORA',
    accent: 'jade',
  },
  {
    code: 'PMDM // KOTLIN',
    module: 'ANDROID ROOM',
    title: 'OPERACIÓN DE GUARDIA OFFLINE-FIRST',
    summary:
      'Arquitectura móvil diseñada para analistas SOC sobre el terreno: almacenamiento cifrado del token JWT, caché SQLite Room para consulta sin cobertura y sincronización paginada con Retrofit.',
    specs: [
      'EncryptedSharedPreferences / DataStore para credenciales',
      'Cola local de transiciones pendientes con reconexión automática',
      'Objetivos táctiles >= 48x48dp y etiquetas TalkBack',
    ],
    route: '/dashboard',
    cta: 'ABRIR PANEL EJECUTIVO',
    accent: 'ocean',
  },
];

export const BrutalistStackAccordion: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="blade-accordion" role="region" aria-label="Arquitectura modular de VulnFollowUp">
      {BLADES.map((blade, idx) => {
        const isOpen = idx === activeIdx;
        return (
          <div
            key={blade.code}
            className={`blade-item blade-accent-${blade.accent} ${isOpen ? 'blade-open' : ''}`}
            onMouseEnter={() => setActiveIdx(idx)}
          >
            <button
              type="button"
              className="blade-trigger"
              aria-expanded={isOpen}
              onClick={() => setActiveIdx(idx)}
            >
              <span className="blade-code mono">{blade.code}</span>
              <span className="blade-vertical-title">{blade.module}</span>
            </button>

            <div className="blade-content">
              <div className="blade-module-chip mono">{blade.module}</div>
              <h3 className="blade-heading">{blade.title}</h3>
              <p className="blade-summary">{blade.summary}</p>
              <ul className="blade-specs mono">
                {blade.specs.map((spec) => (
                  <li key={spec}>▸ {spec}</li>
                ))}
              </ul>
              <Link to={blade.route} className="blade-cta mono">
                {blade.cta} ↗
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};
