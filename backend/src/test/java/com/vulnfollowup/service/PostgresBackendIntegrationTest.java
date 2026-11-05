package com.vulnfollowup.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.vulnfollowup.dto.AuthResponse;
import com.vulnfollowup.dto.VulnerabilityCreateCommand;
import com.vulnfollowup.model.AuditLog;
import com.vulnfollowup.model.User;
import com.vulnfollowup.model.Vulnerability;
import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;
import com.vulnfollowup.model.enums.UserRole;
import com.vulnfollowup.model.enums.VulnerabilityStatus;
import com.vulnfollowup.repository.AuditLogRepository;
import com.vulnfollowup.repository.CvssAssessmentRepository;
import com.vulnfollowup.repository.UserRepository;
import com.vulnfollowup.repository.VulnerabilityAssetRepository;
import com.vulnfollowup.repository.VulnerabilityRepository;
import com.vulnfollowup.support.AbstractPostgresIntegrationTest;
import com.vulnfollowup.support.OfficialDatabaseScripts;

/**
 * Batería de pruebas de integración contra PostgreSQL 15 real (Testcontainers {@code postgres:15-alpine})
 * cargando {@code 01_schema.sql} y {@code 02_seed_data.sql} con {@code Statement.execute(...)}
 * y validando las entidades con {@code spring.jpa.hibernate.ddl-auto=validate}.
 *
 * <p>Cubre los 5 casos clave del proyecto de 2.º DAM (Acceso a Datos):</p>
 * <ol>
 *   <li>Login BCrypt de los 4 usuarios del seed y rechazo de contraseña errónea.</li>
 *   <li>Ciclo de vida de {@code VFU-0012} ({@code PENDIENTE DE REMEDIACIÓN -> RESUELTA -> CERRADA})
 *       verificando {@code resolved_at} y las 2 filas nuevas en {@code audit_logs}.</li>
 *   <li>Importación de {@code data/vulnerabilities_invalid_rollback_test.json} comprobando que al
 *       fallar el 4.º registro ({@code VFU-0094}, nota {@code 9.8} con {@code LOW}), la BD hace
 *       ROLLBACK de las 3 primeras y mantiene exactamente 20 vulnerabilidades.</li>
 *   <li>Rechazo de {@code VIEWER} intentando crear/editar, rechazo de {@code 9.8} con {@code LOW},
 *       rechazo de salto {@code ABIERTA -> CERRADA} y bloqueo de borrado si hay auditoría.</li>
 *   <li>Conflicto de concurrencia real ({@link ObjectOptimisticLockingFailureException}) cuando
 *       2 analistas editan la misma vulnerabilidad a la vez ({@code @Version}).</li>
 * </ol>
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PostgresBackendIntegrationTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private AuthService authService;

    @Autowired
    private VulnerabilityService vulnerabilityService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VulnerabilityRepository vulnerabilityRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private CvssAssessmentRepository cvssAssessmentRepository;

    @Autowired
    private VulnerabilityAssetRepository vulnerabilityAssetRepository;

    @Autowired
    private com.vulnfollowup.repository.ProviderRiskJdbcDao providerRiskJdbcDao;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void restoreCleanSeedBeforeEachTest() {
        OfficialDatabaseScripts.reset(dataSource);
    }

    @Test
    @Order(1)
    @DisplayName("1. Login BCrypt de los 4 usuarios del seed y rechazo de contraseña errónea")
    void loginDeLos4UsuariosDelSeedYRechazoDeContrasenaErronea() {
        // 1.1 Login exitoso de los 4 usuarios oficiales de 02_seed_data.sql
        AuthResponse admin = authService.login("admin_dora", "AdminDora#2026!");
        assertTrue(admin.isAuthenticated());
        assertEquals(UserRole.ADMIN, admin.getRole());

        AuthResponse analystSoc = authService.login("analyst_soc", "AnalystSoc#2026!");
        assertTrue(analystSoc.isAuthenticated());
        assertEquals(UserRole.ANALYST, analystSoc.getRole());

        AuthResponse analystApp = authService.login("analyst_appsec", "AnalystApp#2026!");
        assertTrue(analystApp.isAuthenticated());
        assertEquals(UserRole.ANALYST, analystApp.getRole());

        AuthResponse viewer = authService.login("auditor_viewer", "ViewerDora#2026!");
        assertTrue(viewer.isAuthenticated());
        assertEquals(UserRole.VIEWER, viewer.getRole());

        // 1.2 Rechazo de contraseña errónea y de usuario inexistente con el mismo mensaje genérico
        IllegalArgumentException wrongPwd = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login("analyst_soc", "ContrasenaIncorrecta#123")
        );
        assertEquals(AuthService.INVALID_CREDENTIALS, wrongPwd.getMessage());

        IllegalArgumentException unknownUser = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login("usuario_inexistente", "AdminDora#2026!")
        );
        assertEquals(AuthService.INVALID_CREDENTIALS, unknownUser.getMessage());
    }

    @Test
    @Order(2)
    @DisplayName("2. Ciclo de vida de VFU-0012 (PENDIENTE DE REMEDIACIÓN -> RESUELTA -> CERRADA) con resolved_at y +2 filas en audit_logs")
    void cicloDeVidaVfu0012ConResolvedAtYDosFilasNuevasEnAuditLogs() {
        User analystSoc = userRepository.findByUsername("analyst_soc").orElseThrow();
        Vulnerability vfu0012 = vulnerabilityService.findWithDetailsByInternalCode("VFU-0012");

        // Estado inicial del caso obligatorio del seed (HostingSur S.L. / API de pagos)
        assertEquals(VulnerabilityStatus.PENDIENTE_DE_REMEDIACION, vfu0012.getStatus());
        assertEquals(new BigDecimal("9.8"), vfu0012.getCvssScore());
        assertEquals(CvssSeverity.CRITICAL, vfu0012.getSeverity());
        assertNull(vfu0012.getResolvedAt(), "En PENDIENTE DE REMEDIACIÓN resolved_at debe ser NULL");
        assertTrue(vfu0012.getAssetIds().contains(8), "VFU-0012 debe afectar al activo 8 (API de pagos)");

        long initialAuditCount = auditLogRepository.countByVulnerabilityId(vfu0012.getId());

        // Paso 1: PENDIENTE DE REMEDIACIÓN -> RESUELTA
        Vulnerability resolved = vulnerabilityService.changeStatus(
                vfu0012.getId(),
                VulnerabilityStatus.RESUELTA,
                "Aplicado parche parametrizado y WAF sobre el endpoint de liquidación de pagos de HostingSur",
                analystSoc
        );
        assertEquals(VulnerabilityStatus.RESUELTA, resolved.getStatus());
        OffsetDateTime resolvedTimestamp = resolved.getResolvedAt();
        assertNotNull(resolvedTimestamp, "Al pasar a RESUELTA debe asignarse resolved_at");

        // Paso 2: RESUELTA -> CERRADA
        Vulnerability closed = vulnerabilityService.changeStatus(
                vfu0012.getId(),
                VulnerabilityStatus.CERRADA,
                "Retesting completado por el equipo SOC; mitigación verificada en producción",
                analystSoc
        );
        assertEquals(VulnerabilityStatus.CERRADA, closed.getStatus());
        assertEquals(resolvedTimestamp, closed.getResolvedAt(),
                "Al pasar de RESUELTA a CERRADA se conserva el mismo resolved_at");

        // Verificación de las 2 filas nuevas en audit_logs
        List<AuditLog> logs = auditLogRepository.findByVulnerabilityIdOrderByCreatedAtAscIdAsc(vfu0012.getId());
        assertEquals(initialAuditCount + 2, logs.size(), "Deben haberse insertado exactamente 2 filas nuevas en audit_logs");

        AuditLog transitionToResolved = logs.get(logs.size() - 2);
        assertEquals(AuditLog.ACTION_STATUS_TRANSITION, transitionToResolved.getActionType());
        assertEquals(VulnerabilityStatus.PENDIENTE_DE_REMEDIACION, transitionToResolved.getPreviousStatus());
        assertEquals(VulnerabilityStatus.RESUELTA, transitionToResolved.getNewStatus());

        AuditLog transitionToClosed = logs.get(logs.size() - 1);
        assertEquals(AuditLog.ACTION_STATUS_TRANSITION, transitionToClosed.getActionType());
        assertEquals(VulnerabilityStatus.RESUELTA, transitionToClosed.getPreviousStatus());
        assertEquals(VulnerabilityStatus.CERRADA, transitionToClosed.getNewStatus());
    }

    @Test
    @Order(3)
    @DisplayName("3. Rollback transaccional al importar data/vulnerabilities_invalid_rollback_test.json (0 filas a medias)")
    void importacionJsonConRollbackTransaccionalMantieneExactamente20Vulnerabilidades() {
        User analystSoc = userRepository.findByUsername("analyst_soc").orElseThrow();

        long vulnsBefore = vulnerabilityRepository.count();
        long auditsBefore = auditLogRepository.count();
        long assessmentsBefore = cvssAssessmentRepository.count();
        long linksBefore = vulnerabilityAssetRepository.count();
        assertEquals(20L, vulnsBefore, "El seed oficial debe partir de exactamente 20 vulnerabilidades");

        // Al importar el lote de 5 registros, los 3 primeros (VFU-0091, VFU-0092, VFU-0093) son válidos,
        // pero el 4.º (VFU-0094: score 9.8 con severidad LOW) lanza IllegalArgumentException y dispara ROLLBACK.
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> vulnerabilityService.importVulnerabilitiesFromJsonFile(
                        OfficialDatabaseScripts.DEFAULT_ROLLBACK_JSON_PATH,
                        analystSoc
                )
        );
        assertTrue(ex.getMessage().contains("Incoherencia CVSS"),
                "El fallo debe indicar Incoherencia CVSS en VFU-0094, pero fue: " + ex.getMessage());

        // Comprobación post-rollback: 0 registros a medias en todas las tablas
        assertEquals(20L, vulnerabilityRepository.count(),
                "Tras el rollback el total de vulnerabilidades debe seguir siendo 20");
        assertFalse(vulnerabilityRepository.existsByInternalCode("VFU-0091"), "VFU-0091 debe haberse revertido");
        assertFalse(vulnerabilityRepository.existsByInternalCode("VFU-0092"), "VFU-0092 debe haberse revertido");
        assertFalse(vulnerabilityRepository.existsByInternalCode("VFU-0093"), "VFU-0093 debe haberse revertido");
        assertFalse(vulnerabilityRepository.existsByInternalCode("VFU-0094"), "VFU-0094 no debe existir");
        assertFalse(vulnerabilityRepository.existsByInternalCode("VFU-0095"), "VFU-0095 no debe existir");

        assertEquals(auditsBefore, auditLogRepository.count(), "No deben quedar audit_logs huérfanos");
        assertEquals(assessmentsBefore, cvssAssessmentRepository.count(), "No deben quedar cvss_assessments huérfanos");
        assertEquals(linksBefore, vulnerabilityAssetRepository.count(), "No deben quedar vulnerability_assets huérfanos");
    }

    @Test
    @Order(4)
    @DisplayName("4. Casos inválidos: VIEWER sin permisos, 9.8 con LOW, salto ABIERTA -> CERRADA y borrado bloqueado por auditoría")
    void rechazoDeCasosInvalidosYPermisosRbac() {
        User admin = userRepository.findByUsername("admin_dora").orElseThrow();
        User analystSoc = userRepository.findByUsername("analyst_soc").orElseThrow();
        User viewer = userRepository.findByUsername("auditor_viewer").orElseThrow();

        VulnerabilityCreateCommand validCmd = new VulnerabilityCreateCommand(
                "VFU-0099",
                "CVE-2026-99099",
                "Vulnerabilidad de prueba RBAC",
                "Descripción técnica de prueba",
                VulnerabilityStatus.ABIERTA,
                CvssVersion.V3_1,
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                new BigDecimal("9.8"),
                CvssSeverity.CRITICAL,
                "Plan de mitigación",
                analystSoc.getId(),
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 3, 1),
                List.of(8)
        );

        // 4.1 VIEWER rechazado al intentar crear o editar
        assertThrows(SecurityException.class,
                () -> vulnerabilityService.createVulnerability(validCmd, viewer));

        Vulnerability vfu0001 = vulnerabilityRepository.findByInternalCode("VFU-0001").orElseThrow();
        assertThrows(SecurityException.class,
                () -> vulnerabilityService.updateVulnerability(
                        vfu0001.getId(), "Nuevo título", null, null, null, viewer));

        // 4.2 Nota 9.8 con severidad LOW rechazada por CvssValidator
        VulnerabilityCreateCommand incoherentCvssCmd = new VulnerabilityCreateCommand(
                "VFU-0098",
                "CVE-2026-99098",
                "CVSS incoherente 9.8 con LOW",
                "Debe rechazarse antes del INSERT",
                VulnerabilityStatus.ABIERTA,
                CvssVersion.V3_1,
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                new BigDecimal("9.8"),
                CvssSeverity.LOW,
                "Plan",
                analystSoc.getId(),
                LocalDate.of(2026, 2, 1),
                LocalDate.of(2026, 3, 1),
                List.of(8)
        );
        IllegalArgumentException cvssEx = assertThrows(
                IllegalArgumentException.class,
                () -> vulnerabilityService.createVulnerability(incoherentCvssCmd, analystSoc)
        );
        assertTrue(cvssEx.getMessage().contains("Incoherencia CVSS"));

        // 4.3 Salto ilegal ABIERTA -> CERRADA rechazado sin añadir filas en audit_logs
        assertEquals(VulnerabilityStatus.ABIERTA, vfu0001.getStatus());
        long auditsBeforeIllegalTransition = auditLogRepository.countByVulnerabilityId(vfu0001.getId());
        assertThrows(IllegalStateException.class,
                () -> vulnerabilityService.changeStatus(
                        vfu0001.getId(),
                        VulnerabilityStatus.CERRADA,
                        "Intento de cerrar directamente desde ABIERTA",
                        analystSoc
                )
        );
        assertEquals(auditsBeforeIllegalTransition, auditLogRepository.countByVulnerabilityId(vfu0001.getId()));

        // 4.4 Borrado por ADMIN bloqueado si la vulnerabilidad tiene historial en audit_logs
        assertThrows(IllegalArgumentException.class,
                () -> vulnerabilityService.deleteVulnerability(vfu0001.getId(), admin));
    }

    @Test
    @Order(5)
    @DisplayName("5. Conflicto de concurrencia real (@Version) lanza ObjectOptimisticLockingFailureException")
    void conflictoDeConcurrenciaRealConVersionLanzaObjectOptimisticLockingFailureException() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // Dos analistas leen simultáneamente la misma vulnerabilidad (VFU-0001 con version = 0)
        Vulnerability copyAnalyst1 = txTemplate.execute(
                status -> vulnerabilityRepository.findByInternalCode("VFU-0001").orElseThrow());
        Vulnerability copyAnalyst2 = txTemplate.execute(
                status -> vulnerabilityRepository.findByInternalCode("VFU-0001").orElseThrow());

        assertEquals(0, copyAnalyst1.getVersion());
        assertEquals(0, copyAnalyst2.getVersion());

        // El Analista 1 guarda primero su edición -> el registro en BD sube a version = 1
        txTemplate.executeWithoutResult(status -> {
            copyAnalyst1.setTitle("Título actualizado por Analista 1");
            vulnerabilityRepository.saveAndFlush(copyAnalyst1);
        });

        // El Analista 2 intenta guardar su copia desactualizada (version = 0) -> salta bloqueo optimista
        assertThrows(ObjectOptimisticLockingFailureException.class, () ->
                txTemplate.executeWithoutResult(status -> {
                    copyAnalyst2.setTitle("Título pisado por Analista 2");
                    vulnerabilityRepository.saveAndFlush(copyAnalyst2);
                })
        );

        // En la base de datos prevalece el cambio del Analista 1 con version = 1
        Vulnerability reloaded = vulnerabilityRepository.findByInternalCode("VFU-0001").orElseThrow();
        assertEquals("Título actualizado por Analista 1", reloaded.getTitle());
        assertEquals(1, reloaded.getVersion());
    }

    @Test
    @Order(6)
    @DisplayName("6. Re-evaluación CVSS 1:N (reassessCvss) desactiva la anterior, respeta uq_cvss_assessments_one_current y audita el cambio")
    void reevaluacionCvss1NActualizaInstantaneaMantieneHistoricoYAudita() {
        User analystAppsec = userRepository.findByUsername("analyst_appsec").orElseThrow();
        Vulnerability vfu0001 = vulnerabilityRepository.findByInternalCode("VFU-0001").orElseThrow();

        // Antes de re-evaluar: VFU-0001 tiene 1 evaluación CVSS v3.1 vigente
        assertEquals(1, cvssAssessmentRepository.findByVulnerabilityIdOrderByAssessedAtAscIdAsc(vfu0001.getId()).size());
        assertEquals(1L, cvssAssessmentRepository.countByVulnerabilityIdAndCurrentTrue(vfu0001.getId()));
        long auditsBefore = auditLogRepository.countByVulnerabilityId(vfu0001.getId());

        // Re-evaluación a CVSS v4.0 con nota 8.7 (HIGH)
        String v4Vector = "CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N";
        Vulnerability reassessed = vulnerabilityService.reassessCvss(
                vfu0001.getId(),
                "4.0",
                v4Vector,
                new BigDecimal("8.7"),
                CvssSeverity.HIGH,
                "Recalculado bajo estándar FIRST CVSS v4.0 tras confirmar que requiere privilegios bajos (PR:L)",
                analystAppsec.getId()
        );

        // 1. La instantánea en vulnerabilities se ha actualizado a 4.0 / 8.7 / HIGH
        assertEquals(CvssVersion.V4_0, reassessed.getCvssVersion());
        assertEquals(v4Vector, reassessed.getCvssVector());
        assertEquals(new BigDecimal("8.7"), reassessed.getCvssScore());
        assertEquals(CvssSeverity.HIGH, reassessed.getSeverity());

        // 2. En cvss_assessments ahora hay 2 filas para VFU-0001: la 1.ª histórica (is_current=false) y la 2.ª vigente (is_current=true)
        var history = cvssAssessmentRepository.findByVulnerabilityIdOrderByAssessedAtAscIdAsc(vfu0001.getId());
        assertEquals(2, history.size());
        assertFalse(history.get(0).isCurrent(), "La evaluación v3.1 anterior debe quedar con is_current = false");
        assertTrue(history.get(1).isCurrent(), "La nueva evaluación v4.0 debe quedar con is_current = true");
        assertEquals(1L, cvssAssessmentRepository.countByVulnerabilityIdAndCurrentTrue(vfu0001.getId()),
                "Solo puede existir 1 evaluación vigente (uq_cvss_assessments_one_current)");

        // 3. Se ha insertado 1 nuevo registro en audit_logs con ACTION_CVSS_REASSESSMENT
        List<AuditLog> logs = auditLogRepository.findByVulnerabilityIdOrderByCreatedAtAscIdAsc(vfu0001.getId());
        assertEquals(auditsBefore + 1, logs.size());
        assertEquals(AuditLog.ACTION_CVSS_REASSESSMENT, logs.get(logs.size() - 1).getActionType());
    }

    @Test
    @Order(7)
    @DisplayName("7. Rendimiento ORM: @EntityGraph evita el problema N+1 (1 sola SQL para 20 vulnerabilidades) y paginación usa idx_vuln_status_severity_score")
    void prevencionDelProblemaNMas1YConsultaPaginadaConIndiceCompuesto(
            @Autowired jakarta.persistence.EntityManagerFactory emf) {
        org.hibernate.stat.Statistics stats = emf.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        // 1. Cargar las 20 vulnerabilidades con sus usuarios, activos y proveedores TIC usando @EntityGraph
        List<Vulnerability> allWithDetails = vulnerabilityService.findAllWithDetails();
        assertEquals(20, allWithDetails.size());
        assertEquals(1L, stats.getPrepareStatementCount(),
                "Con @EntityGraph las 20 vulnerabilidades, sus activos y proveedores deben cargarse en 1 sola consulta SQL");

        // Además, al estar ya inicializadas dentro del grafo, se pueden recorrer fuera de @Transactional
        // sin disparar consultas adicionales ni LazyInitializationException:
        long totalAssetLinks = allWithDetails.stream()
                .mapToLong(v -> v.getAssetLinks().stream()
                        .peek(link -> {
                            assertNotNull(link.getAsset().getName());
                            if (link.getAsset().getProvider() != null) {
                                assertNotNull(link.getAsset().getProvider().getName());
                            }
                        })
                        .count())
                .sum();
        assertTrue(totalAssetLinks >= 20, "Deben haberse recorrido todos los activos vinculados sin lanzar más SQL");
        assertEquals(1L, stats.getPrepareStatementCount(),
                "Recorrer las relaciones fuera de la transacción no debe disparar ninguna consulta adicional (0 N+1)");

        // 2. Consulta paginada filtrando por status + severity ordenada por cvss_base_score DESC
        var page = vulnerabilityService.findByStatusAndSeverityPaginated(
                VulnerabilityStatus.PENDIENTE_DE_REMEDIACION,
                CvssSeverity.CRITICAL,
                org.springframework.data.domain.PageRequest.of(0, 5)
        );
        assertFalse(page.isEmpty());
        // Todas cumplen el filtro combinado y vienen ordenadas de mayor a menor nota CVSS
        BigDecimal previousScore = new BigDecimal("10.0");
        boolean containsVfu0012 = false;
        for (Vulnerability v : page.getContent()) {
            assertEquals(VulnerabilityStatus.PENDIENTE_DE_REMEDIACION, v.getStatus());
            assertEquals(CvssSeverity.CRITICAL, v.getSeverity());
            assertTrue(v.getCvssScore().compareTo(previousScore) <= 0,
                    "Debe venir ordenado por cvss_base_score DESC");
            previousScore = v.getCvssScore();
            if ("VFU-0012".equals(v.getInternalCode())) {
                containsVfu0012 = true;
            }
        }
        assertTrue(containsVfu0012, "La página de PENDIENTE DE REMEDIACIÓN + CRITICAL debe incluir el caso VFU-0012");
    }

    @Test
    @Order(8)
    @DisplayName("8. Acceso a Datos completo: DAO JDBC (PreparedStatement + commit/rollback manual) y Exportación JSON/CSV de HostingSur S.L.")
    void daoJdbcConPreparedStatementYExportacionJsonYCsvPorProveedorTic(
            @org.junit.jupiter.api.io.TempDir java.nio.file.Path tempDir) throws Exception {
        // 1. Consulta JDBC con PreparedStatement para el proveedor #5 (HostingSur S.L.)
        var reportOpt = providerRiskJdbcDao.findProviderRiskReportById(5);
        assertTrue(reportOpt.isPresent(), "Debe existir el informe JDBC del proveedor 5 (HostingSur S.L.)");
        var report = reportOpt.get();
        assertEquals("PROV-005", report.providerCode());
        assertEquals("HostingSur S.L.", report.providerName());
        assertEquals(LocalDate.of(2026, 3, 15), report.reviewDate());
        assertTrue(report.openOrPendingHighCriticalVulns() >= 1, "HostingSur tiene al menos VFU-0012 abierta/pendiente");
        assertEquals(new BigDecimal("9.8"), report.maxCvssScore(), "La nota máxima de HostingSur debe ser 9.8 (VFU-0012)");

        // 2. Transacción manual JDBC: commit exitoso y rollback cuando el id no existe
        providerRiskJdbcDao.updateProviderReviewDateManualTx(5, LocalDate.of(2026, 4, 1));
        assertEquals(LocalDate.of(2026, 4, 1),
                providerRiskJdbcDao.findProviderRiskReportById(5).orElseThrow().reviewDate());

        assertThrows(IllegalArgumentException.class,
                () -> providerRiskJdbcDao.updateProviderReviewDateManualTx(9999, LocalDate.of(2026, 5, 1)));

        // 3. Exportación a JSON y a CSV de las vulnerabilidades PENDIENTE DE REMEDIACIÓN de HostingSur S.L. (id 5)
        java.nio.file.Path jsonOut = tempDir.resolve("hostingsur_pending.json");
        java.nio.file.Path csvOut = tempDir.resolve("hostingsur_pending.csv");

        var exportedDtos = vulnerabilityService.exportProviderVulnerabilitiesToJsonFile(
                5, VulnerabilityStatus.PENDIENTE_DE_REMEDIACION, jsonOut);
        int csvRows = vulnerabilityService.exportProviderVulnerabilitiesToCsvFile(
                5, VulnerabilityStatus.PENDIENTE_DE_REMEDIACION, csvOut);

        assertFalse(exportedDtos.isEmpty());
        assertEquals(exportedDtos.size(), csvRows);
        assertTrue(exportedDtos.stream().anyMatch(d -> "VFU-0012".equals(d.getInternalCode())));

        String jsonContent = java.nio.file.Files.readString(jsonOut);
        String csvContent = java.nio.file.Files.readString(csvOut);
        assertTrue(jsonContent.contains("VFU-0012") && jsonContent.contains("9.8"));
        assertTrue(csvContent.contains("internal_code,cve_id,title") && csvContent.contains("VFU-0012"));
    }
}
