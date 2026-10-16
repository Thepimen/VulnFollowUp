# Módulo IPE II (Itinerario Personal para la Empleabilidad) - VulnFollowUp

Documentación de gestión de proyecto, análisis estratégico, viabilidad económica y actas de seguimiento para el equipo de desarrollo (2 desarrolladores).

---

## 1. Lean Canvas

| Sección | Descripción aplicada a VulnFollowUp |
|---|---|
| **Problema** | • Hojas de cálculo dispersas para gestionar CVEs.<br>• Incumplimiento del reglamento DORA (sanciones millonarias en sector financiero).<br>• Falta de visibilidad de dependencias con proveedores TIC críticos.<br>• Falta de trazabilidad en el ciclo de vida de remediación. |
| **Segmento de Clientes** | • Entidades financieras (banca mediana, fintechs, aseguradoras).<br>• Proveedores TIC críticos de servicios financieros (IaaS, SaaS, pasarelas de pago).<br>• Equipos de Ciberseguridad (CISO, analistas SOC) y Oficiales de Cumplimiento Normativo (DPO/CRO). |
| **Propuesta de Valor Única** | Plataforma integral que automatiza la priorización técnica de vulnerabilidades (CVSS 3.1/4.0) vinculándolas directamente a los activos críticos y proveedores TIC bajo el marco normativo europeo DORA. |
| **Solución** | • Backend Java con gestión concurrente y generación aislada de informes.<br>• Cliente SPA/Escritorio accesible (WCAG 2.1 AA) con KPIs en tiempo real.<br>• App Android con caché local para respuesta ante incidentes en movilidad.<br>• Trazabilidad inmutable de cambios de estado y auditoría. |
| **Canales** | • Venta directa B2B a departamentos de IT/Ciberseguridad.<br>• Partners consultores de cumplimiento normativo DORA/NIS2.<br>• Marketplace de soluciones open-core / SaaS especializado. |
| **Fuentes de Ingresos** | • Suscripción anual por número de activos monitorizados (Tier 1/2/3).<br>• Módulo avanzado de auditoría continua de Proveedores TIC DORA.<br>• Soporte corporativo y despliegue on-premise en infraestructura bancaria. |
| **Estructura de Costes** | • Infraestructura cloud de desarrollo y pruebas (CI/CD, bases de datos).<br>• Costes de personal (2 desarrolladores de software senior).<br>• Certificaciones de seguridad y auditorías externas de código. |
| **Métricas Clave** | • MTTR (Mean Time to Remediate) de vulnerabilidades críticas.<br>• Cobertura de activos mapeados a proveedores TIC bajo DORA.<br>• Tiempo de respuesta de endpoints API (< 150 ms con paginación optimizada). |
| **Ventaja Competitiva** | Integración nativa del marco DORA Capítulo V junto con motores de validación CVSS v4.0 y soporte multiplataforma con resiliencia offline. |

---

## 2. Análisis DAFO (SWOT)

```
        ORIGEN INTERNO                         ORIGEN EXTERNO
┌─────────────────────────────────┬─────────────────────────────────┐
│          FORTALEZAS             │          OPORTUNIDADES          │
│ • Equipo ágil de 2 desarrolladores│ • Entrada en vigor obligatoria de│
│   con roles claramente definidos│   DORA (enero 2025 en toda la UE)│
│ • Arquitectura desacoplada en   │ • Fuerte demanda de herramientas│
│   monorepo con contratos API    │   de automatización de resiliencia│
│ • Cumplimiento nativo WCAG AA y │ • Crecimiento de proveedores TIC│
│   principios Green Software     │   en la nube en el sector bancario│
├─────────────────────────────────┼─────────────────────────────────┤
│          DEBILIDADES            │            AMENAZAS             │
│ • Capacidad limitada de horas   │ • Competencia de grandes suites │
│   al ser un equipo de 2 personas│   de GRC y SIEM (Splunk, Tenable)│
│ • Alcance acotado a la versión  │ • Cambios o aclaraciones de las │
│   MVP inicial del curso         │   Autoridades Europeas (ESA/EBA)│
│ • Ausencia de integración live  │ • Presupuestos restrictivos en  │
│   inicial con escáneres Nessus  │   pequeñas entidades financieras │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## 3. Presupuesto Económico del Proyecto (MVP - 3 Meses)

| Partida Presupuestaria | Unidades / Dedicación | Coste Unitario | Total (€) |
|---|---|---|---|
| **Desarrollador 1 (Backend & DB & DevOps)** | 320 horas (40h/mes x 2 devs equiv.) | 35 €/h | 11.200 € |
| **Desarrollador 2 (Frontend SPA & Android Mobile)** | 320 horas | 35 €/h | 11.200 € |
| **Servidores Cloud Dev & Staging (VPS + DB)** | 3 meses (2 nodos redundantes) | 80 €/mes | 240 € |
| **Dispositivos de Prueba & Licencias IDE** | Licencias y terminales de test | Fijo | 450 € |
| **Contingencias y Margen Imprevistos (10%)** | Cobertura de riesgos técnicos | Estimado | 2.309 € |
| **TOTAL PRESUPUESTO ESTIMADO** | | | **25.399 €** |

---

## 4. Planificación del Proyecto (Gantt simplificado)

- **Sprint 1 (Semanas 1-2)**: Estructura monorepo, modelo E-R, scripts SQL, dataset sintético (`data/`) y baseline backend.
- **Sprint 2 (Semanas 3-4)**: API REST base en Java (CRUD, CVSS validator, concurrencia PSP y tests de condición de carrera).
- **Sprint 3 (Semanas 5-6)**: Cliente Web/Escritorio SPA (Componentes, filtros, WCAG 2.1 AA) y módulo DORA de Proveedores TIC.
- **Sprint 4 (Semanas 7-8)**: Cliente Android (Caché local Room, sync offline) y generación externa de informes (`ProcessBuilder`).
- **Sprint 5 (Semanas 9-10)**: Pruebas cruzadas, optimización Green Software, documentación transversal y defensa oral.

---

## 5. Actas de Reunión de Seguimiento (Equipo de 2)

### Acta 01: Inicio de Proyecto y Asignación de Roles
- **Fecha**: 16/10/2026.
- **Asistentes**: Desarrollador A (Backend/DevOps/DB), Desarrollador B (Frontend/Mobile/UX).
- **Acuerdos alcanzados**:
  1. Aprobación de la estructura monorepo estandarizada según el apartado 12.3 del enunciado.
  2. Adopción de Gitflow simplificado (`main`, `develop`, ramas `feat/*` y `docs/*`).
  3. Fijación de las especificaciones de `PROJECT_CONTEXT.md` como contrato técnico inmutable.
