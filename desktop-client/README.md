# Desktop & Web SPA Client - VulnFollowUp

Component-based Single Page Application (SPA) and desktop client interface for security analysts, IT administrators, and compliance officers using **VulnFollowUp**.

---

## Technical Scope & DAM Modules

- **Desarrollo de Interfaces (DI)**:
  - **Component-Driven Architecture**: Modular UI widgets (KPI metrics cards, CVSS vector calculators, status transition modals, vulnerability data tables).
  - **Accessibility Compliance (WCAG 2.1 AA)**: High-contrast themes, keyboard navigation, clear ARIA roles, legible typography, and semantic HTML elements.
  - **Usability & UX**: Real-time filtering, responsive grid layouts, clear error boundaries, and visual feedback for asynchronous states.
  - **Data Visualization**: Charts depicting vulnerability severity distribution, SLA remediation timelines, and ICT third-party dependency concentration.

---

## Component Structure

```
desktop-client/
├── src/
│   ├── assets/              # Icons, logos, and stylesheets
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, modals, input fields, badges
│   │   ├── dashboard/       # KPI cards, severity distribution charts
│   │   ├── vulnerabilities/ # Vulnerability table, filters, CVSS builder
│   │   └── providers/       # ICT provider risk matrix and details
│   ├── services/            # API client service wrappers (Axios / Fetch)
│   ├── views/               # Page views (Dashboard, Vulnerabilities, Assets, Providers)
│   ├── router/              # Client-side routing with role-based route guards
│   └── styles/              # Global CSS tokens, dark mode variables, WCAG theme
├── index.html
└── package.json
```

---

## Key Views

1. **Executive Dashboard**: Real-time counts of open vulnerabilities, MTTR (Mean Time to Remediate), and DORA compliance indicators.
2. **Vulnerability Registry**: Filterable and paginated list with multi-column sorting (Severity, CVSS, Asset, Status).
3. **Vulnerability Detail & Assessment**: Deep dive into CVSS v3.1/v4.0 vector strings, affected assets, audit trail, and status transition action triggers (`ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`).
4. **ICT Third-Party Providers (DORA)**: Catalog of contracted tech vendors, criticality flags, associated assets, and risk rating.
