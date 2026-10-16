# VulnFollowUp - Reglas de Contexto para Antigravity

Este archivo instruye al asistente de Inteligencia Artificial (Antigravity) sobre las directrices del proyecto.

> [!IMPORTANT]
> **REGLA DE ORO**: Consulta siempre [PROJECT_CONTEXT.md](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/PROJECT_CONTEXT.md) antes de tomar decisiones técnicas o proponer código en este repositorio.

### Resumen de Reglas de Proyecto:
1. **Roles y Seguridad**: `ADMIN`, `ANALYST`, `VIEWER`. Contraseñas protegidas mediante Hash + Salt (BCrypt/Argon2).
2. **Ciclo de Estados**: `ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`.
3. **Validación CVSS Base (v3.1 y v4.0)**: Validar prefijo del vector, nota entre 0.0 y 10.0 y severidad coherente con la escala oficial.
4. **Relaciones Clave**: Relación N:M entre `Vulnerabilities` y `Assets` (`vulnerability_assets`). Relación entre `Assets` y `ICT Providers` (módulo SGE - DORA).
5. **Requisitos Obligatorios PSP**:
   - Concurrencia con protección de recurso compartido (y test unitario demostrable de condición de carrera).
   - Tareas en segundo plano con `ExecutorService`.
   - Lanzamiento de procesos del SO con `ProcessBuilder` para exportación de informes CSV/HTML.
6. **Sostenibilidad & Accesibilidad**: Paginación estricta en endpoints de listado, Green Software y accesibilidad WCAG 2.1 AA en interfaces.

---

### Skills Instaladas en el Proyecto (`.agents/skills/`)

Este repositorio cuenta con dos colecciones de **Agent Skills** integradas en `.agents/skills/` para asistir el ciclo de desarrollo multi-rama:

1. **Superpowers (`obra/superpowers`) — Metodología de Ingeniería y Flujo de Ramas**:
   - Inicialización y protocolo base: [`using-superpowers`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-superpowers/SKILL.md) (con mapeo de herramientas Antigravity en [`antigravity-tools.md`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-superpowers/references/antigravity-tools.md)).
   - Diseño y planificación antes de codificar: [`brainstorming`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brainstorming/SKILL.md) y [`writing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/writing-plans/SKILL.md).
   - Desarrollo guiado por pruebas y depuración (clave para el requisito de concurrencia PSP y validación CVSS): [`test-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/test-driven-development/SKILL.md), [`systematic-debugging`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/systematic-debugging/SKILL.md) y [`verification-before-completion`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/verification-before-completion/SKILL.md).
   - Ejecución en paralelo, ramas e integración (`develop`, `feat/backend-core-setup`, `feat/database-schema-and-seed`, `feat/frontend-wireframes-and-setup`, `docs/transversales-init`): [`executing-plans`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/executing-plans/SKILL.md), [`subagent-driven-development`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/subagent-driven-development/SKILL.md), [`dispatching-parallel-agents`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/dispatching-parallel-agents/SKILL.md), [`using-git-worktrees`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/using-git-worktrees/SKILL.md), [`requesting-code-review`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/requesting-code-review/SKILL.md) y [`finishing-a-development-branch`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/finishing-a-development-branch/SKILL.md).

2. **Taste Skill (`Leonxlnx/taste-skill`) — Dirección de Arte y Diseño de Interfaces (`desktop-client/`, `android-app/`)**:
   - Diseño web/frontend anti-slop y auditoría visual en navegador: [`taste-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/taste-skill/SKILL.md) (`design-taste-frontend`) y [`redesign-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/redesign-skill/SKILL.md).
   - Sistemas visuales específicos para UI/UX: [`minimalist-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/minimalist-skill/SKILL.md) (`minimalist-ui`), [`soft-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/soft-skill/SKILL.md) (`high-end-visual-design`), [`brutalist-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brutalist-skill/SKILL.md) y [`stitch-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/stitch-skill/SKILL.md).
   - Generación de referencias visuales (web/mobile/brand) y código completo sin truncamiento: [`image-to-code-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/image-to-code-skill/SKILL.md), [`imagegen-frontend-web`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/imagegen-frontend-web/SKILL.md), [`imagegen-frontend-mobile`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/imagegen-frontend-mobile/SKILL.md), [`brandkit`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/brandkit/SKILL.md) y [`output-skill`](file:///c:/Users/luisl/OneDrive/Escritorio/Programacion%20y%20proyectos/VulnFollowUp/.agents/skills/output-skill/SKILL.md) (`full-output-enforcement`).
   - *Nota*: Al aplicar `taste-skill` o variantes visuales en `desktop-client/`, mantén siempre la prioridad de **accesibilidad WCAG 2.1 AA** exigida por `PROJECT_CONTEXT.md`.

