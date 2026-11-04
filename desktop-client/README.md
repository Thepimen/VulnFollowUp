# VulnFollowUp — Desktop / Web SPA Client (`desktop-client/`)

Enterprise DevSecOps & EU DORA Compliance Single-Page Application (SPA) built with **React 18 + TypeScript 5 + Vite 5**, engineered to **100% WCAG 2.1 Level AA** accessibility and **Green Software** principles.

---

## 1. Architecture & Directory Structure

```text
desktop-client/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx         # Accessible Sidebar + Topbar + RBAC Role/Theme/Language controls
│   │   ├── SeverityBadge.tsx    # Non-color-only CVSS badge (SVG icon + geometric shape + text + score)
│   │   ├── StatusBadge.tsx      # 4-state lifecycle & DORA AT_RISK / COMPLIANT badges
│   │   └── SkipLink.tsx         # Keyboard 'Skip to main content' link (#main-content)
│   ├── hooks/
│   │   └── useTheme.ts          # Dark/Light theme hook persisted in localStorage + prefers-color-scheme
│   ├── pages/
│   │   ├── LoginPage.tsx        # /login — JWT authentication & seed user selector
│   │   ├── DashboardPage.tsx    # /dashboard — Executive Bento KPIs + HostingSur S.L. VFU-0012 alert
│   │   ├── VulnerabilitiesPage.tsx # /vulnerabilities — Multi-filter + Green Software pagination
│   │   ├── AssetsPage.tsx       # /assets — Technological inventory (API de pagos -> HostingSur S.L.)
│   │   └── ProvidersPage.tsx    # /providers — EU DORA Chapter V portfolio & Provider Risk Report
│   ├── services/
│   │   └── apiClient.ts         # Typed HTTP client (VITE_API_BASE_URL) + Phase 1 seed fallback
│   ├── styles/
│   │   ├── tokens.css           # WCAG 2.1 AA Dark/Light semantic color & typography tokens
│   │   └── global.css           # Bento layout, focus-visible rings, accessible tables
│   ├── types/
│   │   └── api.ts               # Strict TypeScript DTOs aligned 1:1 with docs/api/openapi.yaml
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Environment Variables & Quick Start

1. Copy `.env.example` to `.env` (optional; defaults to `http://localhost:8080`):
   ```bash
   cp .env.example .env
   ```
2. Install dependencies and start the Vite development server:
   ```bash
   npm install
   npm run dev
   ```
3. Run strict TypeScript verification and production bundle build:
   ```bash
   npm run typecheck
   npm run build
   ```

---

## 3. WCAG 2.1 Level AA & Green Software Highlights

- **Dual High-Contrast Theme (`data-theme="dark" | "light"`)**: Persisted in `localStorage` and initialized from `prefers-color-scheme`. Every foreground/background pair exceeds **4.5:1** contrast ratio (primary text reaches **16.4:1** in Dark mode and **17.8:1** in Light mode).
- **Non-Color-Only Status & Severity Indicators (WCAG SC 1.4.1)**: `SeverityBadge` and `StatusBadge` combine distinct SVG shapes (diamond, triangle, square, circle, lock), border radii (`0px`, `3px`, `6px`, `999px`), uppercase text, and numeric scores.
- **Full Keyboard Navigation & Landmarks (WCAG SC 2.1.1 & 2.4.1)**: Includes a visible-on-focus `SkipLink` (`#main-content`), `<aside>`, `<nav>`, `<header>`, `<main id="main-content">`, and `2px solid` `:focus-visible` outlines.
