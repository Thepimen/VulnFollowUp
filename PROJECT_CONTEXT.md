# Contexto Técnico del Proyecto: VulnFollowUp (DAM 2.º)

> **Documento de Referencia Permanente para Agentes de IA y Desarrolladores.**  
> Este archivo resume todas las especificaciones obligatorias, restricciones de arquitectura y reglas de negocio del Proyecto Intermodular de 2.º DAM.

---

## 1. Visión General del Proyecto
- **Nombre**: VulnFollowUp
- **Propósito**: Plataforma para gestionar y priorizar vulnerabilidades técnicas bajo el marco normativo europeo **DORA** (Reglamento UE 2022/2554 de Resiliencia Operativa Digital).
- **Equipo**: 2 Desarrolladores de Software.
- **Estructura de Repositorio**: Monorepo con 4 componentes principales (`backend/`, `desktop-client/`, `android-app/`, `database/`) más datasets (`data/`) y documentación transversal (`docs/`).

---

## 2. Roles de Usuario y Seguridad
- **Roles Permitidos**:
  1. `ADMIN`: Control total del sistema, gestión de usuarios, proveedores TIC y configuración global.
  2. `ANALYST`: Registro de vulnerabilidades, validación CVSS, vinculación de activos y cambios en el ciclo de vida.
  3. `VIEWER`: Consulta de lectura en dashboards, inventarios y exportación de informes.
- **Mecanismo de Contraseñas**:
  - Almacenamiento obligatorio con **hash criptográfico + salt aleatorio por usuario** (ej. BCrypt con factor de coste $\ge 12$ o Argon2id).
  - Queda terminantemente prohibido almacenar contraseñas en texto plano.

---

## 3. Ciclo de Vida de las Vulnerabilidades
Toda vulnerabilidad registrada debe transitar obligatoriamente por los siguientes estados discretos con validación de transiciones permitidas:

```
[ABIERTA] ---> [PENDIENTE DE REMEDIACIÓN] ---> [RESUELTA] ---> [CERRADA]
     ^                                              |
     |--------------- (En caso de regresión) -------|
```

- **Transiciones válidas**:
  - `ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN`: Cuando se programa un parche o se implementa un control compensatorio.
  - `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA`: Cuando el parche ha sido aplicado y validado en entorno de pruebas/staging.
  - `RESUELTA` $\rightarrow$ `CERRADA`: Cierre formal auditado por el equipo de seguridad en producción.
  - `RESUELTA` $\rightarrow$ `ABIERTA`: En caso de reapertura por fallo en el parche o reaparición de la brecha.
- **Historial de Auditoría**: Cada cambio de estado debe registrar: `usuario_id`, `estado_anterior`, `estado_nuevo`, `motivo_justificacion` y `timestamp`.

---

## 4. Motor de Validación CVSS (v3.1 y v4.0)
El sistema debe persistir de forma atómica:
1. `cvss_version`: Cadena `"3.1"` o `"4.0"`.
2. `cvss_vector`: Cadena de métricas oficial (ej. `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` o `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`).
3. `cvss_score`: Valor decimal en punto flotante con precisión de un decimal entre `0.0` y `10.0`.
4. `severity`: Enum de severidad (`NONE`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### Reglas de Coherencia Obligatorias
- **Consistencia de Prefijo**:
  - Si `cvss_version == "4.0"`, el vector DEBE comenzar por `"CVSS:4.0/"`.
  - Si `cvss_version == "3.1"`, el vector DEBE comenzar por `"CVSS:3.1/"`.
  - Debe rechazarse cualquier inserción con versión `"4.0"` y vector `"CVSS:3.1/..."` o viceversa con error HTTP 400.
- **Escala Oficial de Severidad**:
  - `0.0` $\rightarrow$ `NONE` / Ninguna
  - `0.1` a `3.9` $\rightarrow$ `LOW` / Baja
  - `4.0` a `6.9` $\rightarrow$ `MEDIUM` / Media
  - `7.0` a `8.9` $\rightarrow$ `HIGH` / Alta
  - `9.0` a `10.0` $\rightarrow$ `CRITICAL` / Crítica
- **Rechazo por Incoherencia**: Una vulnerabilidad con severidad declarada `LOW` y nota `9.8` debe ser rechazada de inmediato por validación de negocio.

---

## 5. Modelo de Datos y Relaciones Clave
- **Relación N:M (Vulnerabilidades $\leftrightarrow$ Activos)**:
  - Una vulnerabilidad puede afectar a múltiples activos de IT.
  - Un activo de IT puede verse afectado por múltiples vulnerabilidades simultáneas.
  - Implementación física en base de datos mediante tabla intermedia `vulnerability_assets`.
- **Relación Proveedores TIC con Activos (Módulo SGE - DORA Capítulo V)**:
  - Cada activo de IT puede depender de un Proveedor de Servicios TIC externo (`provider_id` en `assets`).
  - DORA exige identificar si el proveedor es crítico (`CRITICAL_THIRD_PARTY`) para calcular el riesgo acumulado de la cadena de suministro.

---

## 6. Requisitos Técnicos de PSP (Programación de Servicios y Procesos)
El backend en Java debe cumplir demostrablemente 3 pilares de PSP:
1. **Concurrencia con Protección de Recurso Compartido**:
   - Existencia de un recurso compartido en memoria (ej. contador global de incidencias en triaje, balanceador o caché de estadísticas).
   - Protección de la sección crítica mediante `synchronized`, `ReentrantLock` o tipos atómicos (`AtomicInteger`, `ConcurrentHashMap`).
   - **Test Demostrable**: Debe existir una prueba de estrés unitaria (`@Test`) que demuestre la condición de carrera (*race condition*) cuando no hay protección y su resolución con exclusión mutua.
2. **Tareas Asíncronas en Segundo Plano (`ExecutorService`)**:
   - Empleo de un pool de hilos (`ExecutorService` / `ThreadPoolExecutor`) para procesar la importación masiva de CVEs desde ficheros JSON/CSV y para la compilación de informes periódicos sin bloquear el hilo de atención HTTP.
3. **Lanzamiento de Procesos Externos (`ProcessBuilder`)**:
   - Generación de informes consolidados (CSV, HTML o PDF) mediante la ejecución de un proceso del sistema operativo independiente usando `ProcessBuilder`.
   - Control de redirección de flujos estándar y de error (`InputStream`), manejo de timeout y comprobación de código de salida (`exitValue == 0`).

---

## 7. Catálogo de Endpoints Mínimos Obligatorios

| Método | Endpoint | Módulos Relacionados | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | PSP, AD | Autenticación con hash/salt y entrega de token. |
| `GET` | `/api/assets` | AD, SGE | Listado de activos con criticidad y proveedor TIC asociado. |
| `GET` | `/api/vulnerabilities` | AD, Sostenibilidad | Listado con filtros combinados (estado, severidad) y **paginación estricta** obligatoria. |
| `GET` | `/api/vulnerabilities/{id}`| AD | Detalle completo de vulnerabilidad, vector y activos vinculados. |
| `POST` | `/api/vulnerabilities` | AD, PSP | Alta con validación CVSS y consistencia estricta. |
| `PATCH`| `/api/vulnerabilities/{id}/status` | AD, SGE | Transición de estado con auditoría inmutable. |
| `POST` | `/api/vulnerabilities/{id}/assessment` | AD | Registro de notas técnicas, controles compensatorios y triaje. |
| `GET` | `/api/dashboard/summary` | DI, AD | Métricas agregadas (MTTR, ratio de abiertas, críticas sin parche). |
| `GET` | `/api/providers` | SGE, DORA | Catálogo de terceros proveedores de servicios TIC. |
| `POST` | `/api/providers` | SGE, DORA | Homologación y registro de nuevo proveedor TIC. |
| `GET` | `/api/providers/{id}/report` | PSP, SGE | Generación asíncrona de informe de riesgo de proveedor mediante `ProcessBuilder`. |

---

## 8. Mapeo Curricular de Módulos (2.º DAM)
- **PSP**: Concurrencia de hilos, test de condición de carrera, `ExecutorService`, `ProcessBuilder`.
- **Acceso a Datos**: Base de datos relacional (DDL/DML), relación N:M, DAO/Repository, transacciones ACID.
- **Desarrollo de Interfaces**: SPA web/escritorio por componentes, WCAG 2.1 AA, UX de filtrado y dashboard.
- **PMDM**: App Android con persistencia local Room, resiliencia offline y sincronización REST.
- **SGE**: Marco normativo DORA Capítulo V, gestión del riesgo de concentración de terceros TIC y BPMN.
- **Inglés**: Documentación del contrato API en inglés, glosario bilingüe de 30 términos y executive summary.
- **IPE II**: Lean Canvas, DAFO, presupuesto económico, cronograma y actas de equipo.
- **Digitalización**: Diagrama de flujo de datos, informe de transformación y mapa de tecnologías.
- **Sostenibilidad**: Reducción de consumo de red (-97%), paginación eficiente y decálogo Green Software.
