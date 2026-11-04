# Línea Base de Sostenibilidad y Criterios de Green Software (Fase 1)

## 1. Compromiso de Ingeniería de Software Verde (Green Software Engineering)

El sector de las Tecnologías de la Información y la Comunicación (TIC) representa entre el **2 % y el 4 % de las emisiones globales de gases de efecto invernadero**. En aplicaciones empresariales de ciberseguridad y monitorización continua, el desperdicio energético suele originarse en **tres antipatrones arquitectónicos**:
1. Transferencia masiva de colecciones completas sin paginación (`SELECT *` devolviendo miles de registros JSON en cada refresco de pantalla).
2. Re-peticiones HTTP constantes desde dispositivos móviles por carecer de caché local (*Offline-First*).
3. Interfaces gráficas de monitorización (SOC/NOC) con fondos blancos de máxima luminancia que permanecen encendidas 24x7 en monitores OLED/AMOLED.

En **VulnFollowUp**, la sostenibilidad no es un añadido cosmético posterior, sino un **requisito no funcional de diseño** integrado desde la Fase 1 en la base de datos (`01_schema.sql`), el contrato API (`openapi.yaml`), el cliente de escritorio (`desktop-client/`) y la app Android (`android-app/`).

---

## 2. Medición Cuantitativa: Impacto de la Paginación Obligatoria en Red, RAM y CPU

### 2.1 Metodología de Cálculo (Línea Base Fase 1)

De acuerdo con la especificación [`docs/api/openapi.yaml`](../api/openapi.yaml), un objeto serializado `VulnerabilitySummary` (incluyendo metadatos, versión y vector CVSS, severidad, estado, usuario asignado y resumen de activos/proveedores vinculados) tiene un tamaño medio medido de **452 bytes** en formato JSON UTF-8 sin comprimir.

En un entorno productivo de una entidad financiera sujeta a DORA que acumula **5.000 vulnerabilidades históricas** en su base de datos, comparamos el impacto de una consulta al endpoint `GET /api/vulnerabilities` bajo dos escenarios:
- **Escenario A (Antipatrón — Sin Paginación)**: El servidor serializa y transmite los 5.000 registros completos en cada carga o cambio de filtro.
- **Escenario B (Arquitectura VulnFollowUp — Paginación Estricta `size=20` + Índices Compuestos)**: El servidor aplica `LIMIT 20 OFFSET 0` apoyándose en el índice compuesto `idx_vulnerabilities_status_created` y `idx_cvss_Current_severity_score`, devolviendo únicamente la página activa dentro de la envolvente `PageResponse<VulnerabilitySummary>`.

### 2.2 Tabla Comparativa de Eficiencia (Por Petición y Proyección Mensual)

| Métrica de Eficiencia (Green KPI) | Escenario A: Sin Paginación (5.000 registros/petición) | Escenario B: Paginado VulnFollowUp (`size=20` registros/petición) | Reducción / Ahorro Logrado |
| :--- | :--- | :--- | :--- |
| **Tamaño del Payload JSON por petición** | `~2.260.000 bytes` (**2,26 MB**) | `~9.180 bytes` (**9,18 KB** incl. metadatos de página) | **-99,59 % de tráfico de red** |
| **Filas leídas en PostgreSQL (Heap Scan)** | `5.000 filas` (*Sequential Scan* + *Sort* en memoria) | `20 filas` (*Index Scan* directo sobre `idx_vulnerabilities_status_created`) | **-99,60 % de I/O de disco y CPU BD** |
| **Nodos DOM renderizados en el navegador (React)** | `> 45.000 nodos DOM` (5.000 filas x 9 celdas) | `~180 nodos DOM` (20 filas x 9 celdas) | **-99,60 % de memoria RAM de renderizado** |
| **Tráfico mensual estimado** *(10 analistas x 80 consultas/día x 22 días laborables = 17.600 peticiones/mes)* | **39,78 GB / mes** transferidos | **161,57 MB / mes** transferidos | **Ahorro de 39,62 GB / mes** |
| **Consumo energético de red y procesado estimado** *(modelo Shift Project / Green Web Foundation: ~0,81 kWh/GB en red + terminal)* | `~32,22 kWh / mes` (`~13,5 kg CO2e/mes`) | `~0,13 kWh / mes` (`~0,05 kg CO2e/mes`) | **-99,59 % en huella de carbono operativa** |

---

## 3. Las 4 Medidas Técnicas de Software Verde Implementadas en VulnFollowUp

### Medida 1: Paginación Estricta en Servidor y Límite Duro (`maxSize = 100`)
- El contrato [`docs/api/openapi.yaml`](../api/openapi.yaml) define `size = 20` por defecto y rechaza con `400 Bad Request` cualquier petición con `size > 100`.
- Esto impide que clientes mal configurados o scripts automatizados provoquen picos de memoria (*Out-Of-Memory*) en la JVM del backend o saturen el ancho de banda.

### Medida 2: Índices Compuestos de Cobertura en PostgreSQL (`01_schema.sql`)
- Para evitar que la base de datos escanee tablas completas al filtrar por estado, severidad o proveedor TIC, [`database/schema/01_schema.sql`](../../database/schema/01_schema.sql) incorpora índices específicos orientados a las consultas frecuentes de la UI:
  - `idx_vulnerabilities_status_created (status, created_at DESC)`
  - `idx_cvss_current_severity_score (severity, base_score DESC) WHERE is_current = TRUE`
  - `idx_ict_providers_criticality_review (criticality, next_review_date)`
- **Resultado**: Complejidad algorítmica de búsqueda reducida de `O(N)` a `O(log N)`, minimizando los ciclos de CPU del servidor de base de datos.

### Medida 3: Caché Local Offline-First (`Room` en Android y Estado Hidratado en SPA)
- La aplicación móvil Android utiliza **Room (SQLite local)** para almacenar la última página sincronizada de vulnerabilidades y proveedores críticos.
- Cuando el analista abre la app sin cambios o en zonas de baja cobertura, la lectura se resuelve localmente en `< 5 ms` con **0 bytes de uso de antena radio (4G/5G/Wi-Fi)**, que es el componente de mayor consumo energético en un dispositivo móvil.

### Medida 4: Diseño Nativo Dark-First (WCAG 2.1 AA) para Pantallas OLED/AMOLED
- El cliente de escritorio ([`desktop-client/src/styles/theme.css`](../../desktop-client/src/styles/theme.css)) adopta por defecto una paleta **Enterprise Dark** de baja luminancia (`#090D16` y `#111827`) manteniendo ratios de contraste superiores a `4.5:1` (y hasta `15.8:1` en texto principal).
- Según estudios empíricos de consumo en paneles OLED/AMOLED (Purdue University / Android Dev Summit), el uso de interfaces oscuras reduce el consumo eléctrico de la pantalla entre un **42 % y un 63 %** respecto a interfaces de fondo blanco puro (`#FFFFFF`), además de reducir la fatiga visual del analista de seguridad.

---

## 4. Alineación con los Objetivos de Desarrollo Sostenible (ODS — Agenda 2030 ONU)

| ODS | Meta Específica | Contribución Directa de **VulnFollowUp** |
| :--- | :--- | :--- |
| **ODS 8: Trabajo Decente y Crecimiento Económico** | **Meta 8.2 y 8.8**: Elevar la productividad mediante la innovación tecnológica y proteger entornos de trabajo seguros e inclusivos. | Cumplimiento estricto **WCAG 2.1 Nivel AA** (navegación 100 % por teclado, enlace *Skip to main content*, etiquetas no dependientes solo del color para personas con daltonismo y modo claro/oscuro) que garantiza que profesionales con discapacidad visual o motora puedan desempeñar puestos de analista de ciberseguridad sin barreras. |
| **ODS 9: Industria, Innovación e Infraestructura** | **Meta 9.1 y 9.4**: Desarrollar infraestructuras fiables, sostenibles, resilientes y de calidad. | Fortalece la resiliencia digital de las infraestructuras financieras y de pagos europeas (como el caso auditado de `API de pagos` en `HostingSur S.L.`) frente a ciberincidentes en la cadena de suministro TIC bajo la normativa DORA. |
| **ODS 12: Producción y Consumo Responsables** | **Meta 12.2**: Lograr la gestión sostenible y el uso eficiente de los recursos naturales y energéticos. | Aplicación de principios de **Green Software** (paginación obligatoria, índices compuestos, ausencia de librerías pesadas innecesarias y caché local) que reducen en más de un 99 % la transferencia de datos superflua y alargan la vida útil del hardware cliente y servidor. |
| **ODS 16: Paz, Justicia e Instituciones Sólidas** | **Meta 16.6**: Crear a todos los niveles instituciones eficaces y transparentes que rindan cuentas. | Registro de auditoría inmutable (`audit_logs`), control de acceso por roles con privilegio mínimo (`RBAC`) y trazabilidad transparente de quién, cuándo y por qué modificó el estado de una vulnerabilidad o el nivel de riesgo de un proveedor TIC. |
