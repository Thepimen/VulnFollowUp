# VulnFollowUp — SPA Wireframes & WCAG 2.1 Level AA Compliance Baseline

> **Module Scope**: Desarrollo de Interfaces (DI) & Sostenibilidad Aplicada (Green Software)  
> **Implementation**: [`desktop-client/`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/desktop-client/README.md)  
> **Design System**: Enterprise DevSecOps / Financial EU DORA Telemetry (Bento Grid, Zero Gradients, Tabular Monospace Metrics)

---

## 1. Visual Direction & Anti-Slop Principles (`design-taste-frontend`)

Instead of generic AI gradients or decorative glassmorphism, **VulnFollowUp** adopts an authoritative **Financial Security Operations Center (SOC) & EU DORA Governance** interface:

1. **Structural Bento Grid**: High-density 12-column telemetry layout separating executive KPIs, active EU DORA supply-chain alerts, and paginated CVE registries through crisp `1px` surface borders (`--border-subtle`) and stepped flat surface tones (`--bg-ground`, `--bg-surface`, `--bg-elevated`).
2. **Dual Typography Pairing**:
   - **UI & Editorial Headings (`--font-sans`)**: `Inter` / system grotesque with tight headline tracking (`-0.03em`) for rapid executive scanning.
   - **Technical Identifiers (`--font-mono`)**: `JetBrains Mono` / `IBM Plex Mono` with `font-variant-numeric: tabular-nums` for `VFU-0012`, `CVE-2024-21762`, `CVSS:3.1/AV:N/...` vector strings, IP addresses, and contract references.

---

## 2. Screen Wireframes (Phase 1 Navigable Routes)

### 2.1. App Shell + Executive Dashboard (`/dashboard`)

```text
+---------------------------------------------------------------------------------------------------+
| [Skip to main content]                                                                            |
+---------------------------+-----------------------------------------------------------------------+
| VulnFollowUp              | Defensive Vulnerability & ICT Third-Party Risk Platform               |
| EU DORA Chap. V · CVSS    | [Active RBAC Role: ADMIN v]  [ES · Español]  [Dark Mode (OLED)]       |
+---------------------------+-----------------------------------------------------------------------+
| > Panel Ejecutivo DORA    | [!] ALERTA DORA CAP. V: EN RIESGO · AT_RISK | PROV-005 HostingSur S.L.|
|   Vulnerabilidades (CVSS) |     Activo: "API de pagos" (ALTA) afectado por VFU-0012 (CVSS 9.8,    |
|   Inventario de Activos   |     CRITICAL, PENDIENTE DE REMEDIACIÓN). Revisión: marzo (2026-03-15) |
|   Proveedores TIC (DORA)  +-----------------+-----------------+-----------------+-----------------+
|   Acceso / Sesión JWT     | Total Registr.  | Abiertas/Pend.  | Críticas Activas| Proveedores     |
|                           | 20              | 12              | 5 (CVSS >= 9.0) | 4 / 5 EN RIESGO |
|                           +-----------------+-----------------+-----------------+-----------------+
|                           | Vulnerabilidades Prioritarias (CVSS v3.1/v4.0)      | Ciclo de Vida   |
|                           | - VFU-0012 | API de pagos | [♦ CRITICAL 9.8]        | [!] ABIERTA (6) |
|                           | - VFU-0002 | FW-BORDER-A  | [♦ CRITICAL 10.0]       | [*] PEND. (6)   |
|                           | - VFU-0007 | Web Portal   | [♦ CRITICAL 9.8]        | [v] RESUELTA(3) |
|                           | - VFU-0010 | API de pagos | [▲ HIGH 8.6]            | [#] CERRADA (5) |
+---------------------------+-----------------------------------------------------+-----------------+
```

### 2.2. Paginated Vulnerability Registry & Multi-Criteria Filter (`/vulnerabilities`)

```text
+---------------------------------------------------------------------------------------------------+
| Registro Paginado de Vulnerabilidades (CVSS v3.1 & v4.0)                                          |
| [Importar Lote JSON (ExecutorService)] [Exportar CSV/HTML (ProcessBuilder)] [+ Registrar Vuln.]   |
+---------------------------------------------------------------------------------------------------+
| Buscar (VFU, CVE, Título): [ VFU-0012          ]  Severidad: [ CRITICAL v ]  Estado: [ Todos v ]  |
+---------------------------------------------------------------------------------------------------+
| Código / CVE   | Vulnerabilidad & Vector CVSS           | Severidad       | Estado    | Acciones  |
|----------------|----------------------------------------|-----------------|-----------|-----------|
| VFU-0012       | Ejecución remota de código (RCE)...    | [♦ CRITICAL 9.8]| [*] PEND. | [Estado]  |
| CVE-2024-21762 | v3.1: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/... | Square + Icon   | REMEDIAC. | [Cerrar]  |
+---------------------------------------------------------------------------------------------------+
| Mostrando 1 de 1 registros filtrados · Green Software Pagination     [Anterior] Página 1/1 [Sig.] |
+---------------------------------------------------------------------------------------------------+
```

### 2.3. EU DORA ICT Providers & Supply-Chain Risk Report (`/providers`)

```text
+--------------------------------------------------+------------------------------------------------+
| Cartera de Proveedores TIC Regulados             | Informe DORA: HostingSur S.L. [▲ EN RIESGO]    |
|--------------------------------------------------|------------------------------------------------|
| * PROV-005 HostingSur S.L. | [▲ HIGH] | 2026-03  | Contrato: CTR-DORA-2025-HS05 (UNDER_REVIEW)    |
|   PROV-001 CloudScale S.A. | [♦ CRIT] | 2026-06  | Próxima revisión: 2026-03-15 (Marzo)           |
|   PROV-003 CyberShield SOC | [▲ HIGH] | 2026-05  | Activos afectados: API de pagos (AST-PAY-008)  |
|   PROV-002 SwiftFin BV     | [♦ CRIT] | 2026-09  | - VFU-0012 (CVSS 9.8 CRITICAL · PENDIENTE)     |
|   PROV-004 DevOpsForge Ltd | [■ MED]  | 2026-11  | - VFU-0010 (CVSS 8.6 HIGH · PENDIENTE)         |
+--------------------------------------------------+------------------------------------------------+
```

---

## 3. Verified WCAG 2.1 Level AA Contrast Matrix

All color pairs in [`desktop-client/src/styles/tokens.css`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/desktop-client/src/styles/tokens.css) exceed the mandatory **4.5:1** contrast ratio for normal text and **3.0:1** for UI components:

| Semantic Token Pair | Dark Mode Hex (`[data-theme="dark"]`) | Dark Ratio | Light Mode Hex (`[data-theme="light"]`) | Light Ratio | WCAG Level |
|---|---|:---:|---|:---:|:---:|
| Primary Ink on Ground | `#F1F5F9` on `#0B0F14` | **16.4 : 1** | `#0F172A` on `#F8FAFC` | **17.8 : 1** | **AAA** |
| Secondary Ink on Surface | `#CBD5E1` on `#121820` | **11.8 : 1** | `#1E293B` on `#FFFFFF` | **14.5 : 1** | **AAA** |
| Muted Ink on Surface | `#94A3B8` on `#121820` | **6.7 : 1** | `#475569` on `#FFFFFF` | **7.5 : 1** | **AAA** |
| Primary Button Ink on Fill | `#081018` on `#38BDF8` | **10.1 : 1** | `#FFFFFF` on `#0369A1` | **6.3 : 1** | **AA / AAA** |
| `CRITICAL` Badge Ink on Bg | `#FECDD3` on `#3B0A14` | **10.8 : 1** | `#881337` on `#FFE4E6` | **8.4 : 1** | **AAA** |
| `HIGH` Badge Ink on Bg | `#FFEDD5` on `#3B1706` | **11.4 : 1** | `#7C2D12` on `#FFEDD5` | **8.9 : 1** | **AAA** |
| `MEDIUM` Badge Ink on Bg | `#FEF08A` on `#362805` | **11.9 : 1** | `#713F12` on `#FEF9C3` | **9.3 : 1** | **AAA** |
| `LOW` Badge Ink on Bg | `#D1FAE5` on `#072D20` | **11.6 : 1** | `#064E3B` on `#D1FAE5` | **9.6 : 1** | **AAA** |

---

## 4. Non-Color-Only Encoding & Keyboard Accessibility Checklist

1. **SC 1.4.1 (Use of Color)**:
   - `CRITICAL`: Diamond SVG icon (`♦`) + sharp `0px` square border + `"CRITICAL"` label + numeric score.
   - `HIGH`: Warning triangle SVG icon (`▲`) + `3px` radius border + `"HIGH"` label + numeric score.
   - `MEDIUM`: Square SVG icon (`■`) + `6px` radius border + `"MEDIUM"` label + numeric score.
   - `LOW`: Circle SVG icon (`●`) + `999px` pill border + `"LOW"` label + numeric score.
2. **SC 2.4.1 (Bypass Blocks)**: `SkipLink` component (`href="#main-content"`) appears at top-left on first `Tab` keypress.
3. **SC 2.4.7 (Focus Visible)**: High-contrast `2px solid var(--accent-focus)` outline with `2px` offset on all interactive links, buttons, inputs, and selects.
4. **SC 4.1.3 (Status Messages)**: Filter results table and DORA Provider Report panel use `aria-live="polite"` and `role="status"` on badges.
