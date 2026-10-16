# Agent Skills del Proyecto — VulnFollowUp

Este directorio contiene las **Agent Skills** instaladas a nivel de repositorio (`.agents/skills/`) para ser descubiertas automáticamente por **Antigravity** y otros agentes de codificación compatibles en todas las ramas de desarrollo del proyecto.

---

## 1. Colecciones Instaladas

### A. Superpowers (`obra/superpowers`)
Framework de metodología de ingeniería de software y desarrollo guiado por subagentes, TDD y gestión de ramas:
- **Repositorio origen**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Skills incluidas (15)**:
  - `using-superpowers`: Bootstrap de descubrimiento y activación de skills al iniciar sesión.
  - `brainstorming`: Diseño interactivo y refinamiento de especificaciones antes de escribir código.
  - `writing-plans`: Creación de planes de implementación detallados y granulares.
  - `executing-plans`: Ejecución secuencial de planes en la sesión actual.
  - `subagent-driven-development`: Desarrollo iterativo delegando tareas independientes a subagentes con revisión por tarea.
  - `dispatching-parallel-agents`: Orquestación de múltiples subagentes en paralelo para módulos sin estado compartido.
  - `test-driven-development`: Ciclo estricto Red-Green-Refactor (ideal para concurrencia en PSP y motor de validación CVSS).
  - `systematic-debugging`: Diagnóstico de causa raíz antes de aplicar parches.
  - `verification-before-completion`: Verificación empírica obligatoria antes de dar una tarea por terminada.
  - `requesting-code-review` / `receiving-code-review`: Flujos de auditoría de calidad y cumplimiento de especificación.
  - `using-git-worktrees`: Aislamiento de espacios de trabajo para desarrollo paralelo por ramas.
  - `finishing-a-development-branch`: Verificación de tests, integración y limpieza al cerrar una rama de funcionalidad.
  - `writing-skills` / `diagnosing-superpowers`: Mantenimiento y diagnóstico del propio sistema de skills.

### B. Taste Skill (`Leonxlnx/taste-skill`)
Colección de skills de dirección de arte, diseño visual de interfaces y auditoría en navegador real para evitar interfaces genéricas:
- **Repositorio origen**: [https://github.com/Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- **Skills incluidas (14)**:
  - `taste-skill` (`design-taste-frontend`): Dirección de arte v2, referencias visuales y validación con inspector en navegador real (`scripts/inspect.mjs`, `scripts/lint.mjs`).
  - `redesign-skill` (`redesign-existing-projects`): Auditoría y mejora visual de interfaces existentes sin romper funcionalidad.
  - `minimalist-skill` (`minimalist-ui`): Diseño editorial limpio, monocromo cálido y estructura tipo Bento.
  - `soft-skill` (`high-end-visual-design`): Diseño de alto nivel con micro-interacciones y ritmo espacial.
  - `brutalist-skill` (`industrial-brutalist-ui`): Estética técnica suiza de alto contraste.
  - `stitch-skill` (`stitch-design-taste`): Generación de sistemas de diseño semánticos (`DESIGN.md`).
  - `gpt-tasteskill` (`gpt-taste`): Variante estricta de composición y movimiento.
  - `image-to-code-skill` (`image-to-code`): Pipeline de referencia visual a implementación frontend.
  - `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit`: Generación de conceptos visuales para web, Android/móvil e identidad de marca.
  - `output-skill` (`full-output-enforcement`): Garantía de salida de código completa sin truncamientos ni placeholders.
  - `taste-skill-v1`, `taste-skill-v2-experimental`: Versiones previas conservadas por compatibilidad.

---

## 2. Uso Recomendado según la Rama de Desarrollo

| Rama | Propósito en VulnFollowUp | Skills Principales a Utilizar |
|---|---|---|
| `develop` / `main` | Integración continua, arquitectura general y coordinación de releases. | `using-superpowers`, `brainstorming`, `writing-plans`, `requesting-code-review`, `finishing-a-development-branch` |
| `feat/backend-core-setup` | API REST en Java, concurrencia PSP (`ExecutorService`, `ProcessBuilder`, `ReentrantLock`) y motor CVSS v3.1/v4.0. | `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `output-skill` |
| `feat/database-schema-and-seed` | Esquema relacional DDL/DML, relación N:M (`vulnerability_assets`), proveedores TIC (DORA) y semillas. | `brainstorming`, `writing-plans`, `verification-before-completion`, `output-skill` |
| `feat/frontend-wireframes-and-setup` | Cliente Web/Escritorio (`desktop-client/`, WCAG 2.1 AA) y App Android (`android-app/`, Room offline). | `taste-skill`, `minimalist-skill`, `soft-skill`, `redesign-skill`, `imagegen-frontend-mobile`, `test-driven-development` |
| `docs/transversales-init` | Documentación de API en inglés, SGE (DORA Cap. V), IPE II, Digitalización y Sostenibilidad. | `writing-plans`, `output-skill`, `verification-before-completion` |
