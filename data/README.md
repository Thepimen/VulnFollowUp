# Initial Datasets & Seed Data - VulnFollowUp

Initial synthetic datasets (JSON/CSV) for bootstrapping the system, running integration tests, evaluating background ingestion performance (`ExecutorService`), and validating CVSS calculation logic.

---

## Dataset Inventory

1. **`vulnerabilities_seed.json`**:
   - Contains **20 realistic synthetic vulnerabilities / CVE records**.
   - Spans all 4 severity tiers: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
   - Balanced representation of **CVSS v3.1** and **CVSS v4.0** standard vectors.
   - Covers all lifecycle stages: `ABIERTA`, `PENDIENTE DE REMEDIACIÓN`, `RESUELTA`, `CERRADA`.
2. **`assets_seed.json`**:
   - Catalog of critical financial and operational IT assets (Core Banking Servers, Payment Gateways, Web Portals, Identity Providers).
   - Marked with DORA asset criticality levels (Tier 1 Critical, Tier 2 High, Tier 3 Operational).
3. **`providers_seed.json`**:
   - ICT Third-Party Service Providers classified under EU DORA Regulation (Article 28 - Register of Information on third-party arrangements).
   - Includes Cloud Hyperscalers, Managed Security Service Providers (MSSP), and FinTech Core SaaS vendors.

---

## File Formats

- All JSON files use UTF-8 encoding.
- Dates follow ISO-8601 (`YYYY-MM-DDTHH:mm:ssZ`).
- CVSS vectors strictly follow FIRST.org official notation standards.
