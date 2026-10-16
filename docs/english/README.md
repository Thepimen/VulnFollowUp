# English Module Documentation - VulnFollowUp

Documentation compliant with the requirements of the **Ampliación de Lengua Extranjera (Inglés)** module for 2nd DAM.

---

## 1. Executive Summary

### Project Overview
**VulnFollowUp** is an enterprise-grade Vulnerability Management and Operational Resilience Platform designed specifically to address the stringent regulatory demands set forth by the **European Union Digital Operational Resilience Act (DORA - Regulation EU 2022/2554)**. Operating across the financial sector and critical infrastructure ecosystems, financial entities and critical ICT third-party service providers must identify, classify, prioritize, and remediate technical vulnerabilities across their entire digital estate.

### Strategic Objective & Architecture
The system replaces fragmented vulnerability reporting spreadsheets with a centralized, component-based monorepo architecture:
1. A multi-threaded, robust **Java REST Backend** executing asynchronous ingestion pipelines, strict thread-safety mechanisms, and external report generation processes.
2. A normalized relational database preserving complex Many-to-Many relationships between vulnerabilities, assets, and third-party ICT suppliers.
3. An accessible, WCAG 2.1 AA-compliant **Desktop/Web SPA Client** for security analysts and compliance officers.
4. An offline-first **Android Mobile Application** providing on-call incident responders with local cache access and real-time status updates.

### Value Proposition
By coupling standardized **CVSS (Common Vulnerability Scoring System) v3.1 / v4.0** validation engines with DORA Chapter V Third-Party Risk Management workflows, VulnFollowUp bridges the gap between low-level technical cybersecurity remediation and regulatory compliance oversight.

---

## 2. Bilingual Technical Glossary (30 Terms)

| # | English Term | Término en Español | Definition (English) | Definición (Español) |
|---|---|---|---|---|
| 1 | **Digital Operational Resilience Act (DORA)** | Ley de Resiliencia Operativa Digital | EU regulatory framework strengthening cybersecurity and IT operational resilience for financial entities. | Marco normativo de la UE para reforzar la ciberseguridad y la resiliencia operativa TIC en el sector financiero. |
| 2 | **Common Vulnerabilities and Exposures (CVE)** | Vulnerabilidades y Exposiciones Comunes | Standardized dictionary of publicly known information security flaws and identifiers. | Diccionario estandarizado de identificadores públicos de fallos de seguridad de la información. |
| 3 | **Common Vulnerability Scoring System (CVSS)** | Sistema de Puntuación de Vulnerabilidades Comunes | Standardized framework for assessing the principal characteristics and severity of software vulnerabilities. | Marco estandarizado para evaluar las características y severidad de vulnerabilidades de software. |
| 4 | **CVSS Vector String** | Cadena de Vector CVSS | Textual representation containing encoded metric values used to compute vulnerability base scores. | Representación textual de valores métricos codificados utilizada para calcular la nota base de severidad. |
| 5 | **Attack Vector (AV)** | Vector de Ataque | Metric reflecting the context by which vulnerability exploitation is possible (Network, Adjacent, Local, Physical). | Métrica que refleja el contexto por el cual es posible explotar la vulnerabilidad (Red, Adyacente, Local, Físico). |
| 6 | **Base Score** | Puntuación Base | Numeric score ranging from 0.0 to 10.0 indicating inherent vulnerability severity. | Puntuación numérica de 0.0 a 10.0 que indica la severidad inherente de una vulnerabilidad. |
| 7 | **Triage** | Triaje / Priorización | The formal process of categorizing, validating, and prioritizing vulnerabilities according to business risk. | Proceso formal de categorizar, validar y priorizar vulnerabilidades según el riesgo empresarial. |
| 8 | **Critical ICT Third-Party Provider** | Proveedor TIC Tercero Crítico | External entity delivering IT services whose disruption impairs essential financial functions. | Entidad externa que suministra servicios TIC cuya interrupción compromete funciones financieras críticas. |
| 9 | **Attack Surface** | Superficie de Ataque | The total sum of digital endpoints and attack vectors exposed to unauthorized threat actors. | La suma total de puntos finales y vectores de ataque expuestos a actores de amenazas. |
| 10 | **Role-Based Access Control (RBAC)** | Control de Acceso Basado en Roles | Security paradigm assigning application permissions based on institutional user roles. | Paradigma de seguridad que asigna permisos de aplicación en función de roles de usuario. |
| 11 | **Race Condition** | Condición de Carrera | Undesirable system state when multiple concurrent threads alter shared memory without synchronization. | Estado indeseable del sistema cuando hilos concurrentes alteran memoria compartida sin sincronización. |
| 12 | **Thread Safety** | Seguridad de Hilos | Program property guaranteeing correct execution across multiple threads accessing shared resources. | Propiedad del código que garantiza ejecución correcta ante múltiples hilos accediendo a recursos compartidos. |
| 13 | **Critical Section** | Sección Crítica | Code segment accessing shared resources that must not be concurrently executed by more than one thread. | Segmento de código que accede a recursos compartidos y que no debe ser ejecutado concurrentemente. |
| 14 | **Asynchronous Ingestion** | Ingestión Asíncrona | Non-blocking data loading executed in background worker threads without stalling the main event loop. | Carga de datos no bloqueante ejecutada en hilos de fondo sin congelar el hilo principal. |
| 15 | **Process Isolation** | Aislamiento de Procesos | Segregation of external executable commands within separate OS process spaces via ProcessBuilder. | Segregación de comandos ejecutables externos en espacios de proceso de SO mediante ProcessBuilder. |
| 16 | **Mean Time to Remediate (MTTR)** | Tiempo Medio de Remediación | Key metric measuring average elapsed time between vulnerability discovery and verified fix deployment. | Métrica clave que mide el tiempo promedio transcurrido entre la detección del fallo y su solución verificada. |
| 17 | **Compensating Control** | Control Compensatorio | Alternative safeguard implemented to reduce risk when direct patching is temporarily unfeasible. | Salvaguarda alternativa implementada para reducir el riesgo cuando el parche directo no es factible. |
| 18 | **Asset Criticality Tier** | Nivel de Criticidad del Activo | Classification designating the operational importance and business impact of an IT asset. | Clasificación que designa la importancia operativa y el impacto en el negocio de un activo TIC. |
| 19 | **Offline-First Architecture** | Arquitectura Offline-First | Application design ensuring core consultation and operations function without active internet connectivity. | Diseño de aplicación que asegura la consulta y operaciones básicas sin conectividad a internet. |
| 20 | **Local Cache Sync** | Sincronización de Caché Local | Mechanism reconciling locally stored mobile database records with the centralized backend API. | Mecanismo que concilia los registros de base de datos local móvil con la API centralizada del backend. |
| 21 | **Green Software Engineering** | Ingeniería de Software Sostenible | Disciplined development targeting minimal carbon footprint, energy efficiency, and network reduction. | Disciplina de desarrollo orientada a minimizar la huella de carbono, optimizar energía y reducir tráfico de red. |
| 22 | **Payload Pruning** | Depuración de Carga Útil | Removing redundant fields from JSON API responses to conserve mobile bandwidth and compute cycles. | Eliminación de campos redundantes en respuestas JSON para conservar ancho de banda y ciclos de CPU. |
| 23 | **Web Content Accessibility Guidelines (WCAG)**| Pautas de Accesibilidad de Contenido Web | International standards defining web accessibility for users with disabilities (Levels A, AA, AAA). | Estándares internacionales que definen la accesibilidad web para personas con discapacidades (A, AA, AAA). |
| 24 | **Single Page Application (SPA)** | Aplicación de Página Única | Web client delivering desktop-like interactivity by dynamically rewriting the current web page. | Cliente web que ofrece interactividad tipo escritorio reescribiendo dinámicamente la página actual. |
| 25 | **Entity-Relationship Model** | Modelo Entidad-Relación | Abstract conceptual representation of data relationships, keys, and constraints in a relational database. | Representación conceptual abstracta de relaciones de datos, claves y restricciones en una base de datos. |
| 26 | **Cryptographic Salt** | Sal Criptográfica | Random bit sequence combined with passwords before hashing to defeat precomputed rainbow table attacks. | Secuencia aleatoria combinada con contraseñas antes del hashing para anular ataques de tablas rainbow. |
| 27 | **Business Process Model and Notation (BPMN)** | Notación para el Modelado de Procesos de Negocio | Standard graphical notation depicting workflow sequences, message flows, and business gateways. | Notación gráfica estándar que representa secuencias de flujo de trabajo, mensajes y compuertas de negocio. |
| 28 | **Audit Trail** | Pista de Auditoría | Chronological, immutable record documenting all status modifications, user identities, and timestamps. | Registro cronológico inmutable que documenta modificaciones de estado, identidades de usuario y fechas. |
| 29 | **Service Level Agreement (SLA)** | Acuerdo de Nivel de Servicio | Formal contractual commitment defining expected service uptime, performance, and remediation speed. | Compromiso contractual formal que define la disponibilidad esperada, rendimiento y velocidad de remediación. |
| 30 | **Data Transfer Object (DTO)** | Objeto de Transferencia de Datos | Design pattern packaging and transferring data between application layers to decouple entities from APIs. | Patrón de diseño que empaqueta y transfiere datos entre capas desacoplando entidades de la API externa. |

---

## 3. Oral Presentation Script Outline

- **Introduction (2 min)**: Contextualizing DORA regulation and the cybersecurity compliance challenge in modern enterprise ecosystems.
- **Architecture & Technical Pillars (4 min)**:
  - Multi-threaded Java Backend (PSP Concurrency, background workers, isolated report processes).
  - Component-driven Web/Desktop interface (WCAG 2.1 AA accessibility).
  - Android mobile app (Room local database & offline resilience).
- **Core Workflow Demonstration (3 min)**: Registering a vulnerability, running CVSS validation, linking critical assets & ICT providers, and triggering state transitions.
- **Sustainability & Green Code (1 min)**: Demonstrating query optimization, pagination metrics, and reduced carbon impact.
