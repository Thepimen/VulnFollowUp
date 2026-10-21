# VulnFollowUp — AI Agent Rules & Context (Google Antigravity Pro / Gemini / Claude Opus)

This file instructs the AI coding assistant (Google Antigravity Pro, Gemini, and Claude Opus) on the mandatory architectural, security, and skill-invocation rules for the **VulnFollowUp** repository.

> [!IMPORTANT]
> **GOLDEN RULE**: Always consult [PROJECT_CONTEXT.md](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/PROJECT_CONTEXT.md) before making architectural decisions or writing code in this repository. All code comments, commit messages, technical documentation, and agent guides must be maintained at professional DevSecOps standards.

---

## 1. Core Domain & Technical Rules (`PROJECT_CONTEXT.md`)

1. **Defensive Scope Only**: `VulnFollowUp` is strictly a **defensive vulnerability and ICT third-party risk management platform** aligned with the **EU DORA Regulation (Regulation (EU) 2022/2554)** and **CVSS Base v3.1 / v4.0**. Never introduce offensive, pentesting, or exploitation payloads into this repository.
2. **Roles & Authentication Security**:
   - Three strict RBAC roles: `ADMIN`, `ANALYST`, `VIEWER`.
   - Passwords in `users.password_hash` and seed scripts must ALWAYS be protected with a salted adaptive hash (**BCrypt** cost $\ge 12$ or **Argon2id**). Never store plaintext passwords.
3. **Vulnerability Lifecycle State Machine**:
   - `ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`.
   - Every transition must record an immutable entry in `audit_logs`.
4. **CVSS Base Validation (v3.1 & v4.0 Only)**:
   - Support exclusively **CVSS Base** (`cvss_version` in `'3.1'` or `'4.0'`).
   - Validate vector prefix coherence (`CVSS:3.1/...` or `CVSS:4.0/...`), numeric score (`0.0 <= cvss_score <= 10.0`), and qualitative severity alignment (`0.0 = NONE`, `0.1–3.9 = LOW`, `4.0–6.9 = MEDIUM`, `7.0–8.9 = HIGH`, `9.0–10.0 = CRITICAL`).
5. **Key Relational Entities (`database/`)**:
   - Many-to-Many (`N:M`) relationship between `vulnerabilities` and `assets` via `vulnerability_assets`.
   - One-to-Many (`1:N`) relationship between `ict_providers` (SGE — EU DORA module) and `assets`.
6. **Mandatory DAM PSP Requirements (`backend/`)**:
   - Multi-threaded batch/concurrent processing using `ExecutorService`.
   - Shared resource protection (`ReentrantLock`, `synchronized`, or `Atomic*`) accompanied by a **deterministic JUnit concurrency test** demonstrating race-condition prevention.
   - External OS process execution via `ProcessBuilder` (without shell interpolation) to export CSV/HTML executive reports.
7. **Green Software & Accessibility (WCAG 2.1 AA)**:
   - Mandatory server-side pagination (`page`, `size`) on all collection endpoints; no unbounded `SELECT *` queries.
   - Strict **WCAG 2.1 Level AA** compliance (`>= 4.5:1` contrast ratio, full keyboard navigation, visible `:focus-visible`, ARIA live regions, and non-color-only severity badges) in `desktop-client/` and `android-app/`.

---

## 2. Automatic Workspace Skill Enforcement (`.agents/skills/`)

This repository includes **40 workspace-level Agent Skills** in `.agents/skills/` shared across all Git branches. Antigravity Pro and Gemini MUST automatically activate and enforce these skills based on the active task context:

### A. Engineering Methodology & Planning (`obra/superpowers`)
- **Mandatory Auto-Activation**: Before writing complex backend, database, desktop, or mobile features, automatically enforce:
  - [`using-superpowers`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-superpowers/SKILL.md) (with Antigravity tool mapping in [`antigravity-tools.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-superpowers/references/antigravity-tools.md))
  - [`brainstorming`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brainstorming/SKILL.md) & [`writing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/writing-plans/SKILL.md) before implementation.
  - [`test-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/test-driven-development/SKILL.md), [`systematic-debugging`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/systematic-debugging/SKILL.md), and [`verification-before-completion`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/verification-before-completion/SKILL.md) during implementation and testing.
  - [`executing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/executing-plans/SKILL.md), [`subagent-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/subagent-driven-development/SKILL.md), [`dispatching-parallel-agents`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/dispatching-parallel-agents/SKILL.md), [`requesting-code-review`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/requesting-code-review/SKILL.md), and [`finishing-a-development-branch`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/finishing-a-development-branch/SKILL.md) for multi-branch Git workflows.

### B. Enterprise UI/UX & Accessibility (`Leonxlnx/taste-skill`)
- **Mandatory Auto-Activation**: Whenever creating, styling, or modifying files in `desktop-client/` (or UI layouts in `android-app/`), automatically enforce:
  - [`design-taste-frontend`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/taste-skill/SKILL.md), [`minimalist-ui`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/minimalist-skill/SKILL.md), [`high-end-visual-design`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/soft-skill/SKILL.md), [`redesign-existing-projects`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/redesign-skill/SKILL.md), and [`full-output-enforcement`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/output-skill/SKILL.md).
  - **Strict Constraint**: Combine high-end enterprise dashboard aesthetics with **100% WCAG 2.1 Level AA accessibility**.

### C. Defensive AppSec, CVSS & DORA Compliance (`mukul975/Anthropic-Cybersecurity-Skills` — Defensive Subset)
- **Mandatory Auto-Activation**: Whenever touching authentication, roles (`ADMIN`, `ANALYST`, `VIEWER`), password hashing, CVSS Base (`v3.1`/`v4.0`) validation, REST API schemas, DORA ICT providers, or remediation workflows, automatically enforce:
  - [`prioritizing-vulnerabilities-with-cvss-scoring`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/prioritizing-vulnerabilities-with-cvss-scoring/SKILL.md) (CVSS v3.1/v4.0 vector & score validation)
  - [`implementing-vulnerability-remediation-sla`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-vulnerability-remediation-sla/SKILL.md) (State machine & SLA tracking)
  - [`managing-third-party-vendor-risk`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/managing-third-party-vendor-risk/SKILL.md) (SGE module — EU DORA ICT providers)
  - [`implementing-jwt-signing-and-verification`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-jwt-signing-and-verification/SKILL.md) (BCrypt/Argon2id + JWT + RBAC)
  - [`implementing-api-schema-validation-security`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/implementing-api-schema-validation-security/SKILL.md) (OpenAPI / JSON Schema input validation)
  - [`performing-threat-modeling-with-owasp-threat-dragon`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/performing-threat-modeling-with-owasp-threat-dragon/SKILL.md) (STRIDE / DFD architectural threat modeling)
  - [`performing-web-application-vulnerability-triage`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/performing-web-application-vulnerability-triage/SKILL.md) (Defensive OWASP Top 10 code review)

### D. Architectural Knowledge Graph (`Graphify-Labs/graphify`)
- **Mandatory Auto-Activation**: Whenever answering architectural questions, analyzing cross-module dependencies across `backend/`, `database/`, `desktop-client/`, and `android-app/`, or updating module boundaries, use:
  - [`graphify`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/graphify/SKILL.md) and consult [`docs/architecture-graph.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/docs/architecture-graph.md) and `graphify-out/graph.json`.

### E. DAM Core Stack Skills (`VoltAgent/awesome-agent-skills` Spec)
- **Mandatory Auto-Activation**:
  - [`java-backend-concurrency`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/java-backend-concurrency/SKILL.md) when working in `backend/` (`ExecutorService`, thread safety, race-condition JUnit tests, `ProcessBuilder`, JPA/JDBC transactions).
  - [`relational-database-sql`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/relational-database-sql/SKILL.md) when working in `database/` or `data/` (3NF DDL schema, `vulnerability_assets` N:M join table, `ict_providers` DORA foreign keys, SQL `CHECK` constraints, and ACID rollbacks).
  - [`android-offline-room`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/android-offline-room/SKILL.md) when working in `android-app/` (Room SQLite cache, DataStore/EncryptedSharedPreferences JWT storage, offline-first sync, Material 3 WCAG mobile UI).

> For full documentation and prompt examples, see [`docs/AI_SKILLS_GUIDE.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/docs/AI_SKILLS_GUIDE.md).
