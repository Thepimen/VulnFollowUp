import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CyberMesh3D } from '../components/landing/CyberMesh3D';
import { CvssPrism3D } from '../components/landing/CvssPrism3D';
import { IsometricVaultStage } from '../components/landing/IsometricVaultStage';
import { BrutalistStackAccordion } from '../components/landing/BrutalistStackAccordion';
import { BrandLogo } from '../components/BrandLogo';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

const TICKER_TOKENS = [
  'EU DORA REGULATION 2022/2554',
  'CVSS BASE v3.1 & v4.0 ENGINE',
  'POSTGRESQL 3NF ACID ROLLBACK',
  'JAVA 21 + SPRING SECURITY JWT',
  'EXECUTORSERVICE 32 HILOS PSP',
  'PROCESSBUILDER CSV / HTML',
  'WCAG 2.1 LEVEL AA VERIFIED',
  'ANDROID ROOM OFFLINE-FIRST',
];

const MANIFESTO_WORDS: Array<{ text: string; tone?: 'ocean' | 'jade' }> = [
  { text: 'Cuando' },
  { text: 'una' },
  { text: 'vulnerabilidad' },
  { text: 'CVSS', tone: 'ocean' },
  { text: '9.8', tone: 'ocean' },
  { text: 'golpea' },
  { text: 'la' },
  { text: 'API' },
  { text: 'de' },
  { text: 'pagos,' },
  { text: 'las' },
  { text: 'hojas' },
  { text: 'Excel' },
  { text: 'no' },
  { text: 'te' },
  { text: 'salvan' },
  { text: 'ante' },
  { text: 'una' },
  { text: 'auditoría' },
  { text: 'DORA.', tone: 'jade' },
  { text: 'Trazabilidad' },
  { text: 'inmutable,' },
  { text: 'bloqueo' },
  { text: 'contractual' },
  { text: 'y' },
  { text: 'evidencia' },
  { text: 'en' },
  { text: 'segundos.', tone: 'jade' },
];

export const LandingPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Snappy Emil Kowalski hero entrance choreography
        gsap.from('.lp-hero-reveal', {
          y: 28,
          opacity: 0,
          duration: 0.72,
          stagger: 0.085,
          ease: 'power4.out',
          clearProps: 'transform,opacity',
        });

        // 2. Scroll-scrubbed manifesto illumination
        gsap.fromTo(
          '.lp-scrub-word',
          { opacity: 0.16, y: 8 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.05,
            ease: 'none',
            scrollTrigger: {
              trigger: '.lp-manifesto',
              start: 'top 82%',
              end: 'bottom 52%',
              scrub: 0.6,
            },
          }
        );

        // 3. Staggered reveal on blueprint bento cells
        gsap.from('.brut-cell', {
          y: 26,
          opacity: 0,
          duration: 0.6,
          stagger: 0.09,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.brut-bento',
            start: 'top 82%',
            once: true,
          },
        });

        // 4. 3D Isometric stage reveal
        gsap.from('.iso-stage-wrapper', {
          y: 36,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.iso-stage-wrapper',
            start: 'top 82%',
            once: true,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="lp-root">
      <div className="lp-grain-overlay" aria-hidden="true" />

      {/* Brutalist Sticky Architectural Nav */}
      <header className="lp-nav">
        <Link to="/" className="lp-nav-brand">
          <BrandLogo size={30} variant="brutalist" />
          <span>VulnFollowUp</span>
        </Link>

        <nav className="lp-nav-links" aria-label="Secciones de la presentación">
          <a href="#motor-cvss" className="lp-nav-link">
            Motor CVSS 3D
          </a>
          <a href="#escenario-dora" className="lp-nav-link">
            Bóveda DORA
          </a>
          <a href="#arquitectura" className="lp-nav-link">
            Arquitectura
          </a>
          <a href="#stack-dam" className="lp-nav-link">
            Stack 4 Capas
          </a>
        </nav>

        <div className="lp-nav-actions">
          <Link to="/dashboard" className="lp-nav-cta">
            <span>Entrar al Panel</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <main>
        {/* CHAPTER 1: ATTENTION — Monumental Brutalist Hero + Live 3D Polyhedron */}
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-hero-left">
            <div className="lp-hero-meta lp-hero-reveal">
              <span>[ REGLAMENTO UE 2022/2554 · CAPÍTULO V ]</span>
              <span className="lp-status-live">
                <span className="lp-status-dot" aria-hidden="true" />
                DEFENSIVO 100% · WCAG 2.1 AA
              </span>
            </div>

            <div className="lp-hero-copy-block">
              <h1 id="lp-hero-title" className="lp-h1 lp-hero-reveal">
                RESILIENCIA
                <span className="lp-h1-accent">DORA EN VIVO</span>
              </h1>

              <p className="lp-hero-lead lp-hero-reveal">
                Registra vulnerabilidades <strong>CVSS v3.1 y v4.0</strong> con coherencia
                matemática blindada en SQL, vincula activos críticos a tus{' '}
                <strong>proveedores TIC</strong> y genera evidencia auditable en segundos.
              </p>

              <div className="lp-hero-actions lp-hero-reveal">
                <Link to="/dashboard" className="lp-btn-primary">
                  <span>Abrir Consola Interactiva</span>
                  <span aria-hidden="true">↗</span>
                </Link>
                <Link to="/login" className="lp-btn-secondary">
                  <span>Acceso JWT / RBAC</span>
                </Link>
              </div>
            </div>

            <div className="lp-hero-foot-strip lp-hero-reveal">
              <div className="lp-hero-stat">
                <strong>20/20</strong>
                <span>Tests JUnit + 32 Hilos PSP</span>
              </div>
              <div className="lp-hero-stat">
                <strong style={{ color: '#00D3FB' }}>3NF ACID</strong>
                <span>Rollback Atómico Garantizado</span>
              </div>
              <div className="lp-hero-stat">
                <strong style={{ color: '#83FD80' }}>90 KB</strong>
                <span>Bundle Green Software Gzip</span>
              </div>
            </div>
          </div>

          <div className="lp-hero-right">
            <CyberMesh3D />
          </div>
        </section>

        {/* FULL-BLEED SAPPHIRE TELEMETRY TICKER */}
        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {[...TICKER_TOKENS, ...TICKER_TOKENS].map((token, idx) => (
              <span key={`${token}-${idx}`} className="lp-ticker-item">
                {token}
                <span className="lp-ticker-sep">///</span>
              </span>
            ))}
          </div>
        </div>

        {/* SCRUBBED TYPOGRAPHIC MANIFESTO */}
        <section className="lp-manifesto" aria-label="Propuesta de valor técnica">
          <p className="lp-manifesto-text">
            {MANIFESTO_WORDS.map((word, idx) => (
              <span
                key={`${word.text}-${idx}`}
                className={`lp-scrub-word ${
                  word.tone === 'ocean'
                    ? 'lp-scrub-ocean'
                    : word.tone === 'jade'
                      ? 'lp-scrub-jade'
                      : ''
                }`}
              >
                {word.text}
              </span>
            ))}
          </p>
        </section>

        {/* CHAPTER 2: INTEREST — Interactive 3D CVSS Risk Prism ("The Live Thing") */}
        <section id="motor-cvss" className="lp-section" aria-labelledby="lp-cvss-title">
          <div className="lp-section-header">
            <h2 id="lp-cvss-title" className="lp-h2">
              PRISMA DE RIESGO CVSS 3D
            </h2>
            <p className="lp-section-desc">
              Alterna entre vulnerabilidades reales de la semilla 3NF o dispara un registro
              corrupto (<code>CVSS 4.0</code> con vector <code>3.1</code>) para observar cómo
              reacciona el motor de validación antes de persistir una sola fila.
            </p>
          </div>
          <CvssPrism3D />
        </section>

        {/* CHAPTER 3: DESIRE — 3D Isometric Floating Vault Stage */}
        <section id="escenario-dora" className="lp-section" aria-labelledby="lp-stage-title">
          <div className="lp-section-header">
            <h2 id="lp-stage-title" className="lp-h2">
              BÓVEDA MULTIPLATAFORMA 3D
            </h2>
            <p className="lp-section-desc">
              Mueve el cursor sobre el plano isométrico. Un mismo contrato REST alimenta el
              panel web WCAG 2.1 AA, el semáforo contractual de HostingSur S.L. y el cliente
              móvil Android con caché offline Room.
            </p>
          </div>
          <IsometricVaultStage />
        </section>

        {/* CHAPTER 4: GAPLESS 12-COLUMN BRUTALIST BLUEPRINT BENTO */}
        <section id="arquitectura" className="lp-section" aria-labelledby="lp-arch-title">
          <div className="lp-section-header">
            <h2 id="lp-arch-title" className="lp-h2">
              INGENIERÍA SIN FISURAS
            </h2>
            <p className="lp-section-desc">
              Seis pilares verificables en ejecución real: cero mocks maquillados, cero
              contraseñas en texto plano y cero consultas <code>SELECT *</code> sin paginar.
            </p>
          </div>

          <div className="brut-bento">
            <article className="brut-cell brut-cell-sapphire brut-span-7-r2">
              <div>
                <span className="brut-cell-tag">[ CASO OFICIAL DORA CAPÍTULO V ]</span>
                <h3 className="brut-cell-title" style={{ marginTop: '12px' }}>
                  CADENA DE SUMINISTRO TRAZADA DE EXTREMO A EXTREMO
                </h3>
                <p className="brut-cell-copy" style={{ marginTop: '14px' }}>
                  Cuando aparece una brecha crítica en un activo gestionado por un tercero,
                  VulnFollowUp recalcula automáticamente su estado de riesgo DORA y bloquea la
                  renovación contractual hasta acreditar el cierre formal por el rol{' '}
                  <strong>ADMIN</strong>.
                </p>
              </div>

              <div className="brut-chain-flow">
                <div className="brut-chain-node">
                  <small>PROVEEDOR TIC</small>
                  <strong>PROV-005 · HostingSur S.L.</strong>
                </div>
                <div className="brut-chain-node">
                  <small>ACTIVO N:M</small>
                  <strong>AST-PAY-008 · API de pagos</strong>
                </div>
                <div className="brut-chain-node">
                  <small>BRECHA ACTIVA</small>
                  <strong>VFU-0012 · CVSS 9.8</strong>
                </div>
              </div>
            </article>

            <article className="brut-cell brut-span-5">
              <span className="brut-cell-tag">[ INTEGRIDAD TRANSACCIONAL ACID ]</span>
              <h3 className="brut-cell-title">ROLLBACK TODO-O-NADA</h3>
              <p className="brut-cell-copy">
                Al importar el lote de prueba de 4 vulnerabilidades, los 3 primeros registros
                son válidos y el #4 mezcla versión 4.0 con vector 3.1. PostgreSQL y Spring
                revierten toda la transacción: 0 registros huérfanos.
              </p>
            </article>

            <article className="brut-cell brut-span-5">
              <span className="brut-cell-tag">[ SEGURIDAD DEFENSIVA RFC 7519 ]</span>
              <h3 className="brut-cell-title">BCRYPT $2B$12$ + RBAC ESTRICTO</h3>
              <p className="brut-cell-copy">
                Tres roles aislados en <code>SecurityConfig</code>: <strong>VIEWER</strong>{' '}
                (solo lectura), <strong>ANALYST</strong> (triaje y remediación) y{' '}
                <strong>ADMIN</strong> (cierre <code>CERRADA</code>, borrado y gestión SGE).
              </p>
            </article>

            <article className="brut-cell brut-span-4">
              <span className="brut-cell-tag">[ PSP · CONCURRENCIA ]</span>
              <h3 className="brut-cell-title">32 HILOS SIN CONDICIÓN DE CARRERA</h3>
              <p className="brut-cell-copy">
                Exclusión mutua verificada con <code>ReentrantLock</code>,{' '}
                <code>AtomicInteger</code> y test determinista JUnit 5 sobre pool{' '}
                <code>ExecutorService</code>.
              </p>
            </article>

            <article className="brut-cell brut-span-4">
              <span className="brut-cell-tag">[ PSP · SUBPROCESOS OS ]</span>
              <h3 className="brut-cell-title">INFORMES VÍA PROCESSBUILDER</h3>
              <p className="brut-cell-copy">
                Generación de informes ejecutivos CSV y HTML en un proceso externo del sistema
                operativo con control de timeout y sin interpolación de shell.
              </p>
            </article>

            <article className="brut-cell brut-span-4">
              <span className="brut-cell-tag">[ SOSTENIBILIDAD + ACCESIBILIDAD ]</span>
              <h3 className="brut-cell-title">GREEN SOFTWARE &amp; WCAG 2.1 AA</h3>
              <p className="brut-cell-copy">
                Paginación obligatoria en servidor que reduce la carga de red, contraste
                verificado &gt;= 7.2:1 e insignias geométricas no dependientes del color.
              </p>
            </article>
          </div>
        </section>

        {/* CHAPTER 5: HORIZONTAL BRUTALIST STACK BLADES */}
        <section id="stack-dam" className="lp-section" aria-labelledby="lp-stack-title">
          <div className="lp-section-header">
            <h2 id="lp-stack-title" className="lp-h2">
              CUATRO CAPAS, UN MONOREPO
            </h2>
            <p className="lp-section-desc">
              Desliza el cursor o pulsa sobre cada lámina para inspeccionar cómo encajan
              PostgreSQL, Spring Boot, React y Android Room dentro del proyecto intermodular.
            </p>
          </div>
          <BrutalistStackAccordion />
        </section>

        {/* CHAPTER 6: ACTION — Full-Bleed Sapphire Monolith CTA */}
        <section className="lp-closing" aria-labelledby="lp-closing-title">
          <div className="lp-closing-inner">
            <div>
              <h2 id="lp-closing-title" className="lp-closing-h2">
                AUDITA TU RIESGO ANTES DE MARZO
              </h2>
              <p
                style={{
                  marginTop: '18px',
                  maxWidth: '52ch',
                  color: '#dbeafe',
                  fontSize: '1.05rem',
                }}
              >
                Accede ahora mismo al panel interactivo en Modo Demo Offline o autentícate con
                tu token JWT contra el servidor Spring Boot local.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="lp-btn-primary">
                <span>Lanzar Panel Ejecutivo</span>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                to="/vulnerabilities"
                className="lp-btn-secondary"
                style={{ backgroundColor: '#090C14' }}
              >
                <span>Ver 20 CVEs Paginados</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Oversized Brutalist Wordmark Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="mono" style={{ fontSize: '0.78rem', color: '#93A2BE' }}>
            <strong style={{ color: '#F4F7FF' }}>VULNFOLLOWUP · PROYECTO INTERMODULAR 2.º DAM</strong>
            <div style={{ marginTop: '4px' }}>
              Plataforma Defensiva de Vulnerabilidades y Riesgo TIC · Reglamento (UE) 2022/2554 (DORA)
            </div>
          </div>

          <nav className="lp-footer-links" aria-label="Accesos directos a la aplicación">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/vulnerabilities">Vulnerabilidades</Link>
            <Link to="/assets">Activos</Link>
            <Link to="/providers">Proveedores DORA</Link>
            <Link to="/login">Login JWT</Link>
          </nav>
        </div>

        <div className="lp-footer-wordmark" aria-hidden="true">
          VULNFOLLOWUP
        </div>
      </footer>
    </div>
  );
};
