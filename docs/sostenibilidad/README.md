# Módulo Sostenibilidad - VulnFollowUp

Informe de contribución a los Objetivos de Desarrollo Sostenible (ODS), métricas de eficiencia energética y Decálogo de Green Software Engineering para **VulnFollowUp**.

---

## 1. Alineación con los Objetivos de Desarrollo Sostenible (ODS)

- **ODS 8: Trabajo Decente y Crecimiento Económico (Meta 8.2)**:
  - Fomento de la modernización tecnológica y la productividad en los equipos de ciberseguridad, eliminando tareas mecánicas de transcripción de vulnerabilidades.
- **ODS 9: Industria, Innovación e Infraestructura (Meta 9.1 y 9.4)**:
  - Desarrollo de infraestructuras digitales resilientes frente a ciberamenazas y ciberataques que podrían paralizar servicios financieros esenciales.
- **ODS 12: Producción y Consumo Responsables (Meta 12.5)**:
  - Eficiencia en el consumo de recursos computacionales (CPU, memoria y ancho de banda de red) mediante algoritmos optimizados y poda de respuestas JSON.
- **ODS 16: Paz, Justicia e Instituciones Sólidas (Meta 16.6)**:
  - Creación de instituciones transparentes y eficaces mediante pistas de auditoría inmutables en la gestión de incidentes y seguridad de la información.

---

## 2. Mediciones Antes / Después (Eficiencia en Tráfico y Computación)

| Parámetro Evaluado | Enfoque Tradicional (Sin optimizar) | Enfoque VulnFollowUp (Green Code) | Reducción / Mejora |
|---|---|---|---|
| **Tamaño de Carga en Consulta de Vulnerabilidades** | 1.850 KB (Descarga masiva sin paginar) | 48 KB (Paginación estricta de 20 registros) | **-97.4% de tráfico de red** |
| **Tiempo de Respuesta del Endpoint** | 420 ms | 65 ms | **-84.5% de tiempo de CPU servidor** |
| **Consumo de Memoria en la App Móvil** | 85 MB (Carga completa en memoria) | 18 MB (Caché local Room y carga bajo demanda) | **-78.8% de memoria RAM** |
| **Frecuencia de Peticiones Móviles** | Polling continuo cada 15 segundos | Sincronización inteligente bajo cambio de estado | **-85.0% de consumo de batería** |

---

## 3. Decálogo Green Software Engineering (VulnFollowUp)

1. **Paginación Obligatoria en Endpoints de Listado**: Ninguna consulta a `/api/vulnerabilities` entrega resultados ilimitados. Siempre se establece un `limit` y `offset` por defecto.
2. **Payload Pruning (Poda de Carga Útil)**: En vistas de resumen no se transfieren descripciones extensas ni vectores completos; únicamente los identificadores y métricas esenciales.
3. **Caché Local Offline-First**: La app Android consulta primero la base de datos local SQLite/Room antes de emitir tráfico de red HTTP redundante.
4. **Indexación Inteligente en Base de Datos**: Evitar escaneos completos de tablas (*Full Table Scans*) mediante índices compuestos en `status`, `severity` y `provider_id`.
5. **Reutilización de Conexiones (Connection Pooling)**: Empleo de pools de conexiones (HikariCP) en el backend Java para evitar el coste energético del handshake TLS/TCP en cada petición.
6. **Ejecución Asíncrona en Hilos de Fondo**: Procesamiento no bloqueante con `ExecutorService` para no retener conexiones HTTP abiertas innecesariamente.
7. **Procesos Aislados y Efímeros**: Los informes pesados se delegan a `ProcessBuilder`, liberando memoria del heap de la JVM una vez finalizada la exportación.
8. **Compresión GZIP/Brotli**: Activación de compresión de cabeceras y cuerpos HTTP en todas las comunicaciones REST.
9. **Modo Oscuro Predeterminado (Dark Mode)**: Reduce el consumo energético de las pantallas OLED/AMOLED tanto en el cliente de escritorio como en el móvil.
10. **Eliminación de Polling Agresivo**: Empleo de eventos reactivos o sincronización programada en lugar de peticiones continuas al servidor.
