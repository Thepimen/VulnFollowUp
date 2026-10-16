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
