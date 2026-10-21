# VulnFollowUp — AI Agent Skills Architecture & Usage Guide

> **Target Environment**: Google Antigravity Pro · Gemini · Claude Opus  
> **Workspace Skills Directory**: [`.agents/skills/`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills)  
> **Auto-Activation Rule File**: [`GEMINI.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/GEMINI.md)  
> **Architecture Knowledge Graph**: [`docs/architecture-graph.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/docs/architecture-graph.md)

---

## 1. Overview: How Workspace Agent Skills Work for Our 2-Person Team

**VulnFollowUp** is a 2nd-year Multiplatform Application Development (DAM) Intermodular Project designed as a strictly defensive **Vulnerability and ICT Third-Party Risk Management Platform** aligned with the **EU DORA Regulation (Regulation (EU) 2022/2554)** and **FIRST CVSS Base v3.1 / v4.0**.

To guarantee consistent code quality, strict security controls, high-end accessible UI design, and seamless collaboration between both developers across **Google Antigravity Pro**, **Gemini**, and **Claude Opus**, this repository uses a **Workspace-Level Agent Skills Architecture**:

1. **Git-Tracked Local Discovery (`.agents/skills/`)**:
   - All **40 skills** reside inside `.agents/skills/<skill-folder>/SKILL.md` at the root of the repository and are tracked by Git (never ignored in `.gitignore`).
   - Every `SKILL.md` begins with standardized YAML frontmatter (`name` and a third-person `description` containing semantic trigger keywords) that Google Antigravity Pro and Gemini index at the start of every session.
2. **Zero-Config Automatic Enforcement ([`GEMINI.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/GEMINI.md))**:
   - The root `GEMINI.md` file acts as a persistent system-level rulebook. Whenever either developer opens the repository on any branch (`main`, `develop`, or feature branches), the AI agent reads `GEMINI.md` and automatically activates the matching domain skill before generating plans or writing code.
3. **Progressive Context Loading (Green AI & Token Efficiency)**:
   - Instead of stuffing 15,000+ lines of instructions into every prompt, the agent only loads the lightweight YAML `name` and `description` metadata into memory, reading the full `SKILL.md` and its local `references/` or `scripts/` only when the task requires that specific capability.

---

## 2. Complete Catalog of Installed Skills (40 Skills Across 5 Suites)

### Suite 1: Core Software Engineering Methodology (`obra/superpowers` — 15 Skills)

| # | Skill Folder (`.agents/skills/`) | Skill `name` | Source Repository | Purpose in VulnFollowUp |
|---|---|---|---|---|
| 1 | [`using-superpowers`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-superpowers/SKILL.md) | `using-superpowers` | `obra/superpowers` | Entry-point protocol establishing skill discovery and Antigravity tool mapping (`references/antigravity-tools.md`). |
| 2 | [`brainstorming`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brainstorming/SKILL.md) | `brainstorming` | `obra/superpowers` | Refines requirements, edge cases, and architectural trade-offs before writing any code. |
| 3 | [`writing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/writing-plans/SKILL.md) | `writing-plans` | `obra/superpowers` | Produces bite-sized, file-by-file implementation plans with verification commands. |
| 4 | [`executing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/executing-plans/SKILL.md) | `executing-plans` | `obra/superpowers` | Executes implementation plans systematically with checkpoint verification. |
| 5 | [`test-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/test-driven-development/SKILL.md) | `test-driven-development` | `obra/superpowers` | Enforces strict Red-Green-Refactor TDD for CVSS validation, state transitions, and PSP concurrency tests. |
| 6 | [`systematic-debugging`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/systematic-debugging/SKILL.md) | `systematic-debugging` | `obra/superpowers` | 4-phase root-cause investigation protocol before proposing bug fixes. |
| 7 | [`verification-before-completion`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/verification-before-completion/SKILL.md) | `verification-before-completion` | `obra/superpowers` | Requires running build/test commands and confirming output before claiming any task is finished. |
| 8 | [`requesting-code-review`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/requesting-code-review/SKILL.md) | `requesting-code-review` | `obra/superpowers` | Reviews completed features against `PROJECT_CONTEXT.md` before merging branches. |
| 9 | [`receiving-code-review`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/receiving-code-review/SKILL.md) | `receiving-code-review` | `obra/superpowers` | Evaluates review feedback with technical rigor before applying changes. |
| 10 | [`subagent-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/subagent-driven-development/SKILL.md) | `subagent-driven-development` | `obra/superpowers` | Orchestrates independent implementation tasks using Antigravity subagents (`invoke_subagent`). |
| 11 | [`dispatching-parallel-agents`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/dispatching-parallel-agents/SKILL.md) | `dispatching-parallel-agents` | `obra/superpowers` | Runs 2+ independent module tasks (e.g., `desktop-client/` and `android-app/`) in parallel. |
| 12 | [`using-git-worktrees`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-git-worktrees/SKILL.md) | `using-git-worktrees` | `obra/superpowers` | Isolates parallel feature branch workspaces safely. |
| 13 | [`finishing-a-development-branch`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/finishing-a-development-branch/SKILL.md) | `finishing-a-development-branch` | `obra/superpowers` | Guides clean branch integration (`feat/*` $\rightarrow$ `develop` $\rightarrow$ `main`) after tests pass. |
| 14 | [`writing-skills`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/writing-skills/SKILL.md) | `writing-skills` | `obra/superpowers` | Standards for authoring, testing, and refining custom workspace skills. |
| 15 | [`diagnosing-superpowers`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/diagnosing-superpowers/SKILL.md) | `diagnosing-superpowers` | `obra/superpowers` | Diagnoses agent session workflows and skill activation behavior. |

---

### Suite 2: Enterprise UI/UX & Accessibility Design (`Leonxlnx/taste-skill` — 14 Skills)

| # | Skill Folder (`.agents/skills/`) | Skill `name` | Source Repository | Purpose in VulnFollowUp |
|---|---|---|---|---|
| 16 | [`taste-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/taste-skill/SKILL.md) | `design-taste-frontend` | `Leonxlnx/taste-skill` | Primary enterprise UI/UX engine for `desktop-client/` (calibrated metrics, layout architecture, anti-slop rules + WCAG 2.1 AA). |
| 17 | [`minimalist-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/minimalist-skill/SKILL.md) | `minimalist-ui` | `Leonxlnx/taste-skill` | Clean editorial bento grids, high typographic contrast, and distraction-free data tables for security analysts. |
| 18 | [`soft-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/soft-skill/SKILL.md) | `high-end-visual-design` | `Leonxlnx/taste-skill` | Agency-grade card depth, spacing tokens, and subtle micro-interactions for executive KPI views. |
| 19 | [`brutalist-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brutalist-skill/SKILL.md) | `industrial-brutalist-ui` | `Leonxlnx/taste-skill` | Swiss typographic grids and terminal-inspired telemetry layouts for dense technical CVE logs. |
| 20 | [`redesign-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/redesign-skill/SKILL.md) | `redesign-existing-projects` | `Leonxlnx/taste-skill` | Audits existing screens in `desktop-client/` and upgrades them to enterprise standards without breaking logic. |
| 21 | [`stitch-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/stitch-skill/SKILL.md) | `stitch-design-taste` | `Leonxlnx/taste-skill` | Generates semantic `DESIGN.md` design system tokens for consistent cross-client styling. |
| 22 | [`output-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/output-skill/SKILL.md) | `full-output-enforcement` | `Leonxlnx/taste-skill` | Prevents code truncation (`// ... rest of code`) and enforces 100% complete file generation. |
| 23 | [`gpt-tasteskill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/gpt-tasteskill/SKILL.md) | `gpt-taste` | `Leonxlnx/taste-skill` | Enforces strict grid alignment, wide editorial typography, and balanced section spacing. |
| 24 | [`image-to-code-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/image-to-code-skill/SKILL.md) | `image-to-code` | `Leonxlnx/taste-skill` | Converts visual wireframes and mockups into production HTML/CSS/JS components. |
| 25 | [`imagegen-frontend-web`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/imagegen-frontend-web/SKILL.md) | `imagegen-frontend-web` | `Leonxlnx/taste-skill` | Generates desktop/web UI visual reference boards before coding `desktop-client/`. |
| 26 | [`imagegen-frontend-mobile`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/imagegen-frontend-mobile/SKILL.md) | `imagegen-frontend-mobile` | `Leonxlnx/taste-skill` | Generates mobile UI reference mockups for `android-app/`. |
| 27 | [`brandkit`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brandkit/SKILL.md) | `brandkit` | `Leonxlnx/taste-skill` | Creates cohesive cybersecurity brand identity, color palettes, and icon systems for VulnFollowUp. |
| 28 | [`taste-skill-v1`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/taste-skill-v1/SKILL.md) | `design-taste-frontend-v1` | `Leonxlnx/taste-skill` | Legacy v1 compatibility rules for frontend layout generation. |
| 29 | [`taste-skill-v2-experimental`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/taste-skill-v2-experimental/SKILL.md) | `design-taste-frontend-v2-experimental` | `Leonxlnx/taste-skill` | Single-file dial-driven frontend design reference. |

---

### Suite 3: Architectural Knowledge Graph (`Graphify-Labs/graphify` — 1 Skill)

| # | Skill Folder (`.agents/skills/`) | Skill `name` | Source Repository | Purpose in VulnFollowUp |
|---|---|---|---|---|
| 30 | [`graphify`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/graphify/SKILL.md) | `graphify` | `Graphify-Labs/graphify` | Builds, updates, and queries the persistent architectural knowledge graph (`graphify-out/graph.json`, `GRAPH_REPORT.md`, `graph.html`, and `docs/architecture-graph.md`). |

---

### Suite 4: Defensive AppSec, CVSS & EU DORA Compliance (`mukul975/Anthropic-Cybersecurity-Skills` — 7 Strictly Defensive Skills)

> **Security Policy Note**: Only strictly defensive Application Security, Vulnerability Management, Cryptography, and Third-Party Governance skills were extracted and adapted for Gemini/Antigravity Pro. Zero offensive, pentesting, or exploitation skills exist in this repository.

| # | Skill Folder (`.agents/skills/`) | Skill `name` | Source Repository | Purpose in VulnFollowUp |
|---|---|---|---|---|
| 31 | [`prioritizing-vulnerabilities-with-cvss-scoring`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/prioritizing-vulnerabilities-with-cvss-scoring/SKILL.md) | `prioritizing-vulnerabilities-with-cvss-scoring` | `mukul975/Anthropic-Cybersecurity-Skills` *(Adapted)* | Enforces strict CVSS Base v3.1 & v4.0 vector string validation (`CVSS:3.1/`, `CVSS:4.0/`), numeric bounds (`0.0–10.0`), and FIRST severity coherence (`NONE` to `CRITICAL`). |
| 32 | [`implementing-vulnerability-remediation-sla`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-vulnerability-remediation-sla/SKILL.md) | `implementing-vulnerability-remediation-sla` | `mukul975/Anthropic-Cybersecurity-Skills` *(Adapted)* | Governs the mandatory 4-state vulnerability lifecycle (`ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`), SLA matrices, and `audit_logs` traceability. |
| 33 | [`managing-third-party-vendor-risk`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/managing-third-party-vendor-risk/SKILL.md) | `managing-third-party-vendor-risk` | `mukul975/Anthropic-Cybersecurity-Skills` *(Adapted)* | Guides the **SGE Module** aligned with **EU DORA Regulation (Chapter V)** for managing `ict_providers`, contract statuses, and third-party asset risk exposure. |
| 34 | [`implementing-jwt-signing-and-verification`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-jwt-signing-and-verification/SKILL.md) | `implementing-jwt-signing-and-verification` | `mukul975/Anthropic-Cybersecurity-Skills` *(Adapted)* | Enforces salted **BCrypt/Argon2id** password hashing (`users.password_hash`), hardened RFC 7519 JWT signing/verification, and `ADMIN`/`ANALYST`/`VIEWER` RBAC. |
| 35 | [`implementing-api-schema-validation-security`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-api-schema-validation-security/SKILL.md) | `implementing-api-schema-validation-security` | `mukul975/Anthropic-Cybersecurity-Skills` | Enforces OpenAPI 3.0 & JSON Schema request/response validation, blocking mass assignment, SQLi/XSS payloads, and data leakage. |
| 36 | [`performing-threat-modeling-with-owasp-threat-dragon`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/performing-threat-modeling-with-owasp-threat-dragon/SKILL.md) | `performing-threat-modeling-with-owasp-threat-dragon` | `mukul975/Anthropic-Cybersecurity-Skills` | Builds STRIDE / LINDDUN Data Flow Diagrams (DFDs) and architectural threat models for VulnFollowUp modules. |
| 37 | [`performing-web-application-vulnerability-triage`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/performing-web-application-vulnerability-triage/SKILL.md) | `performing-web-application-vulnerability-triage` | `mukul975/Anthropic-Cybersecurity-Skills` *(Adapted)* | Performs defensive OWASP Top 10 code reviews (parameterized SQL, safe `ProcessBuilder` lists, XSS output encoding, RBAC checks) and OWASP Risk Rating triage. |

---

### Suite 5: DAM Core Stack Skills (`VoltAgent/awesome-agent-skills` Spec — 3 Skills)

| # | Skill Folder (`.agents/skills/`) | Skill `name` | Specification Standard | Purpose in VulnFollowUp |
|---|---|---|---|---|
| 38 | [`java-backend-concurrency`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/java-backend-concurrency/SKILL.md) | `java-backend-concurrency` | `VoltAgent/awesome-agent-skills` | Enforces DAM PSP & AD backend requirements: bounded `ExecutorService`, shared resource locking (`ReentrantLock`/`AtomicInteger`) with `CountDownLatch` JUnit race-condition tests, safe `ProcessBuilder` CSV/HTML report generation, and ACID `@Transactional` rollbacks. |
| 39 | [`relational-database-sql`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/relational-database-sql/SKILL.md) | `relational-database-sql` | `VoltAgent/awesome-agent-skills` | Enforces the 3NF SQL schema (`users`, `ict_providers`, `assets`, `vulnerabilities`, `vulnerability_assets` N:M join table, `audit_logs`), SQL `CHECK` constraints for CVSS v3.1/v4.0, composite indexes for Green Software pagination, and ACID transaction rollbacks. |
| 40 | [`android-offline-room`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/android-offline-room/SKILL.md) | `android-offline-room` | `VoltAgent/awesome-agent-skills` | Enforces DAM PMDM Android requirements: local SQLite caching with Room (`@Entity`, `@Dao`), offline-first repository sync with Retrofit & `WorkManager`, `EncryptedSharedPreferences`/DataStore JWT storage, and Material 3 WCAG 2.1 AA mobile accessibility. |

---

## 3. How to Use Each Skill Suite (Automatic vs. Explicit Invocation)

Both teammates can trigger skills in two ways:
1. **Automatic Triggering (Natural Language)**: Simply describe your task naturally. Because `GEMINI.md` and the YAML `description` fields are pre-configured with domain triggers, Antigravity Pro and Gemini automatically load the relevant `SKILL.md`.
2. **Explicit Invocation (Power-User Prompts)**: Name the exact skill(s) in your prompt to force a specific workflow or combine multiple skills deterministically.

---

### 3.1. Planning, TDD & Branch Workflows (`obra/superpowers`)

- **Automatic Triggering**:
  > *"We need to build the vulnerability state transition endpoint in `backend/`. Let's figure out the edge cases and plan it first."*  
  *(Automatically triggers `brainstorming` $\rightarrow$ `writing-plans` $\rightarrow$ `test-driven-development`)*
- **Explicit Invocation Prompts**:
  ```text
  Use the brainstorming and writing-plans skills to design the implementation plan for the N:M vulnerability_assets assignment service in backend/. Do not write implementation code until we approve the plan.
  ```
  ```text
  Use the test-driven-development skill to implement the CVSS v3.1 and v4.0 validator in backend/ following strict Red-Green-Refactor cycles.
  ```
  ```text
  Use the requesting-code-review and verification-before-completion skills to audit our current branch against PROJECT_CONTEXT.md and run all tests before we merge into develop.
  ```

---

### 3.2. Enterprise UI/UX & Accessibility (`Leonxlnx/taste-skill`)

- **Automatic Triggering**:
  > *"Create the main Vulnerability & DORA ICT Provider Dashboard view in `desktop-client/` with severity filter badges and a paginated table."*  
  *(Automatically triggers `design-taste-frontend`, `minimalist-ui`, and WCAG 2.1 AA rules via `GEMINI.md`)*
- **Explicit Invocation Prompts**:
  ```text
  Use the design-taste-frontend, minimalist-ui, and full-output-enforcement skills to build the Executive Dashboard and Paginated CVE Table in desktop-client/. Strictly enforce WCAG 2.1 AA contrast (>= 4.5:1), visible :focus-visible outlines, keyboard navigation, and non-color-only severity badges.
  ```
  ```text
  Use the redesign-existing-projects and high-end-visual-design skills to audit desktop-client/ and upgrade the ICT Provider Risk cards to an enterprise DevSecOps aesthetic while keeping 100% WCAG 2.1 AA compliance.
  ```

---

### 3.3. Architectural Knowledge Graph (`graphify`)

- **Automatic Triggering**:
  > *"How does a change in `ict_providers` affect the `vulnerabilities` dashboard and Android offline cache? Check the project graph."*  
  *(Automatically queries `graphify-out/graph.json` and `docs/architecture-graph.md`)*
- **Explicit Invocation Prompts**:
  ```text
  /graphify query "What is the dependency path between ict_providers and the Android Room offline cache?"
  ```
  ```text
  /graphify path "Table: ict_providers (SGE - EU DORA Chapter V)" "android-app/ (Android Native Client + Offline Room Cache)"
  ```
  ```text
  /graphify . --update
  ```

---

### 3.4. Defensive Cybersecurity, CVSS v3.1/v4.0 & EU DORA (`Anthropic-Cybersecurity-Skills`)

- **Automatic Triggering**:
  > *"Implement the login endpoint with password hashing, JWT generation, and role checks for `ADMIN`, `ANALYST`, and `VIEWER`."*  
  *(Automatically triggers `implementing-jwt-signing-and-verification` and `performing-web-application-vulnerability-triage`)*
- **Explicit Invocation Prompts**:
  ```text
  Use the prioritizing-vulnerabilities-with-cvss-scoring and implementing-api-schema-validation-security skills to implement the DTO validation rules for CVSS Base v3.1 and v4.0 vectors, numeric scores (0.0-10.0), and FIRST qualitative severity ratings.
  ```
  ```text
  Use the implementing-jwt-signing-and-verification skill to implement salted BCrypt password hashing (cost 12) for the users table, HS256 JWT token signing, and RBAC authorization guards for ADMIN, ANALYST, and VIEWER.
  ```
  ```text
  Use the managing-third-party-vendor-risk skill to design the EU DORA Chapter V ICT Provider risk evaluation service and supply-chain exposure metrics in backend/ and docs/sge/.
  ```
  ```text
  Use the performing-web-application-vulnerability-triage skill to perform a defensive OWASP Top 10 security review on backend/ and desktop-client/, checking for SQL injection, command injection in ProcessBuilder, XSS, and broken access control.
  ```

---

### 3.5. DAM Stack Skills (`java-backend-concurrency`, `relational-database-sql`, `android-offline-room`)

- **Automatic Triggering**:
  > *"Write the SQL DDL schema in `database/` for all tables and seed data"* or *"Implement the `ExecutorService` batch CVE importer and race condition JUnit test in `backend/`."*
- **Explicit Invocation Prompts**:
  ```text
  Use the relational-database-sql skill to create the 3NF SQL DDL script in database/schema/01_schema.sql and realistic seed data in database/seed/02_seed_data.sql including CVSS v3.1/v4.0 CHECK constraints, the vulnerability_assets N:M table, and EU DORA ict_providers foreign keys.
  ```
  ```text
  Use the java-backend-concurrency and test-driven-development skills to implement the bounded ExecutorService CVE batch processor, the ReentrantLock/AtomicInteger shared metrics counter, the CountDownLatch race-condition JUnit 5 test, and the safe ProcessBuilder CSV/HTML report exporter in backend/.
  ```
  ```text
  Use the android-offline-room skill to implement the Room database entities, DAOs, EncryptedSharedPreferences JWT storage, and Offline-First VulnerabilityRepository in android-app/.
  ```

---

## 4. Verification & Compatibility Testing Results (Step 3 Report)

All **40 workspace skills** in `.agents/skills/` were autonomously tested and verified against Google Antigravity Pro and Gemini requirements:

| Verification Criterion | Target | Result | Details |
|---|---|:---:|---|
| **`SKILL.md` Presence & Encoding** | 40 / 40 folders | ✅ **PASS (40/40)** | Every skill directory in `.agents/skills/` contains a valid UTF-8 (LF-normalized) `SKILL.md` file. |
| **YAML Frontmatter (`name` & `description`)** | 40 / 40 skills | ✅ **PASS (40/40)** | All 40 skills declare valid YAML frontmatter with explicit `name` and third-person trigger `description` fields compatible with Gemini & Antigravity Pro discovery. |
| **Cross-Agent Tool Compatibility** | Zero Claude-only blockers | ✅ **PASS** | `using-superpowers` includes `references/antigravity-tools.md` mapping `invoke_subagent`, `ask_question`, `run_command`, etc.; `graphify/SKILL.md` supports both Antigravity `invoke_subagent` (`TypeName="self"`) and CLI execution without requiring external API keys. |
| **Strict Defensive Cybersecurity Policy** | 0 offensive skills/payloads | ✅ **PASS** | Only 7 defensive AppSec/Governance skills were extracted from `Anthropic-Cybersecurity-Skills`. Manual SQLi/XSS attack payloads in `performing-web-application-vulnerability-triage` were replaced with defensive OWASP Top 10 remediation patterns (Parameterized SQL, safe `ProcessBuilder` argument lists, DOM output encoding, RBAC). |
| **Live Graphify Pipeline Execution** | Valid Graph JSON, HTML & Report | ✅ **PASS** | Executed `graphify` across the repository (`17` corpus files, `~9,671` words), generating `24` nodes, `41` directed edges, `2` hyperedges, and `4` communities in `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.html`, and `docs/architecture-graph.md` with `0` diagnostic warnings. |
