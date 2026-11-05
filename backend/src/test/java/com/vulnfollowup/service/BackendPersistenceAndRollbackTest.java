package com.vulnfollowup.service;

import com.vulnfollowup.dto.AuthResponse;
import com.vulnfollowup.model.Asset;
import com.vulnfollowup.model.AuditLog;
import com.vulnfollowup.model.CvssAssessment;
import com.vulnfollowup.model.TicProvider;
import com.vulnfollowup.model.User;
import com.vulnfollowup.model.Vulnerability;
import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;
import com.vulnfollowup.model.enums.ProviderCriticality;
import com.vulnfollowup.model.enums.UserRole;
import com.vulnfollowup.model.enums.VulnerabilityStatus;
import com.vulnfollowup.repository.AssetRepository;
import com.vulnfollowup.repository.AuditLogRepository;
import com.vulnfollowup.repository.TicProviderRepository;
import com.vulnfollowup.repository.UserRepository;
import com.vulnfollowup.repository.VulnerabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Batería de pruebas de integración para defender el módulo de Acceso a Datos (2.º DAM):
 * 1. Registro y Login con BCrypt (coste 12 + sal aleatoria) y control de roles (ADMIN, ANALYST, VIEWER).
 * 2. CRUD de vulnerabilidades con validación CVSS v3.1/v4.0, ciclo de vida y auditoría ("Remediation_Audit").
 * 3. Prueba de Rollback Transaccional al importar data/vulnerabilities_invalid_rollback_test.json.
 */
@SpringBootTest
class BackendPersistenceAndRollbackTest {

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
    private AssetRepository assetRepository;

    @Autowired
    private TicProviderRepository ticProviderRepository;

    private User analystUser;
    private User viewerUser;
    private Asset paymentApiAsset;

    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        vulnerabilityRepository.deleteAll();
        assetRepository.deleteAll();
        ticProviderRepository.deleteAll();
        userRepository.deleteAll();

        // Creamos usuarios de prueba con contraseña cifrada en BCrypt (coste 12)
        analystUser = authService.registerUser("carlos.mendez", "AnalystPass2026!", UserRole.ANALYST);
        viewerUser = authService.registerUser("elena.viewer", "ViewerPass2026!", UserRole.VIEWER);

        // Creamos el proveedor TIC HostingSur S.L. y el activo API de pagos (caso obligatorio SGE / DORA)
        TicProvider hostingSur = new TicProvider(
                "HostingSur S.L.",
                "Alojamiento Cloud y Pasarela de Pagos",
                ProviderCriticality.HIGH,
                "DORA-CON-2026-005",
                LocalDate.of(2026, 3, 15),
                "soporte@hostingsur.es"
        );
        hostingSur = ticProviderRepository.save(hostingSur);

        paymentApiAsset = new Asset(
                "API de pagos",
                "API_SERVICE",
                "Departamento de Medios de Pago",
                "PRODUCTION",
                "ACTIVE",
                hostingSur
        );
        paymentApiAsset = assetRepository.save(paymentApiAsset);
    }

    @Test
    @DisplayName("1. Login con BCrypt coste 12 y verificación de roles (ADMIN, ANALYST, VIEWER)")
    void shouldRegisterWithBCryptAndAuthenticateByRole() {
        // Comprobamos que la contraseña no se guarda en texto plano y lleva el prefijo BCrypt coste 12 ($2a$12$)
        assertNotEquals("AnalystPass2026!", analystUser.getPasswordHash());
        assertTrue(analystUser.getPasswordHash().startsWith("$2a$12$") || analystUser.getPasswordHash().startsWith("$2b$12$"));

        // Login correcto devuelve el rol ANALYST
        AuthResponse response = authService.login("carlos.mendez", "AnalystPass2026!");
        assertTrue(response.isAuthenticated());
        assertEquals(UserRole.ANALYST, response.getRole());
        assertTrue(response.hasAnyRole(UserRole.ADMIN, UserRole.ANALYST));
        assertFalse(response.hasAnyRole(UserRole.ADMIN));

        // Login con contraseña errónea debe fallar
        assertThrows(
                IllegalArgumentException.class,
                () -> authService.login("carlos.mendez", "ClaveIncorrecta123")
        );
    }

    @Test
    @DisplayName("2. Ciclo de vida completo de vulnerabilidad, validación CVSS y registro automático en Auditoría")
    void shouldEnforceCvssCoherenceAndTrackLifecycleInAuditLogs() {
        // Caso obligatorio: VFU-0012 (CVSS 9.8, CRITICA) sobre API de pagos de HostingSur S.L.
        Vulnerability vuln = new Vulnerability(
                "VFU-0012",
                "Inyección SQL en endpoint de liquidación de pagos",
                "Fallo crítico detectado en la pasarela de pagos gestionada por HostingSur S.L.",
                VulnerabilityStatus.ABIERTA,
                analystUser.getId(),
                LocalDate.of(2026, 3, 1),
                null
        );

        CvssAssessment assessment = new CvssAssessment(
                CvssVersion.V3_1,
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                new BigDecimal("9.8"),
                CvssSeverity.CRITICA,
                LocalDate.now(),
                vuln
        );

        Vulnerability saved = vulnerabilityService.createVulnerability(
                vuln,
                assessment,
                Set.of(paymentApiAsset.getId()),
                analystUser
        );
        assertNotNull(saved.getId());

        // Transición 1: ABIERTA -> PENDIENTE_DE_REMEDIACION
        vulnerabilityService.changeStatus(
                saved.getId(),
                VulnerabilityStatus.PENDIENTE_DE_REMEDIACION,
                "Se solicita parche urgente a HostingSur S.L. antes de la revisión de marzo.",
                analystUser
        );

        // Comprobamos que la consulta JPQL de vulnerabilidades pendientes por proveedor TIC la devuelve
        List<Vulnerability> pendingForHostingSur = vulnerabilityRepository.findPendingByTicProviderId(
                paymentApiAsset.getTicProvider().getId()
        );
        assertEquals(1, pendingForHostingSur.size());
        assertEquals("VFU-0012", pendingForHostingSur.get(0).getCveOrInternalId());

        // Transición 2: PENDIENTE_DE_REMEDIACION -> RESUELTA
        vulnerabilityService.changeStatus(
                saved.getId(),
                VulnerabilityStatus.RESUELTA,
                "Parche aplicado y verificado en entorno de pruebas.",
                analystUser
        );

        // Transición 3: RESUELTA -> CERRADA
        vulnerabilityService.changeStatus(
                saved.getId(),
                VulnerabilityStatus.CERRADA,
                "Cierre formal auditado en producción.",
                analystUser
        );

        // Verificamos que se han generado los 4 registros de auditoría (alta inicial + 3 transiciones)
        List<AuditLog> history = auditLogRepository.findByVulnerabilityIdOrderByAuditDateDesc(saved.getId());
        assertEquals(4, history.size());

        // Un usuario con rol VIEWER no puede cambiar estados
        assertThrows(
                SecurityException.class,
                () -> vulnerabilityService.changeStatus(
                        saved.getId(),
                        VulnerabilityStatus.ABIERTA,
                        "Intento sin permisos",
                        viewerUser
                )
        );
    }

    @Test
    @DisplayName("3. Rollback Transaccional en importación JSON: si el 4.º registro es corrupto, se deshacen los 3 primeros")
    void shouldRollbackEntireBatchWhenJsonContainsCorruptCvssRecord() throws Exception {
        // Localizamos el fichero oficial de prueba de rollback del proyecto
        Path rollbackJsonPath = Path.of("..", "data", "vulnerabilities_invalid_rollback_test.json");
        assertTrue(Files.exists(rollbackJsonPath), "Debe existir el fichero ../data/vulnerabilities_invalid_rollback_test.json");

        // Comprobamos que antes de importar hay 0 vulnerabilidades en la BD
        assertEquals(0, vulnerabilityRepository.count());

        // Al importar el lote de 5 registros (3 válidos + registro #4 con versión 4.0 y vector CVSS:3.1/...),
        // debe saltar IllegalArgumentException y ejecutarse el ROLLBACK transaccional completo.
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> vulnerabilityService.importVulnerabilitiesFromJsonFile(rollbackJsonPath, analystUser)
        );
        assertTrue(ex.getMessage().contains("Incoherencia CVSS"));

        // DEMOSTRACIÓN DE ACCESO A DATOS:
        // Ninguno de los 3 primeros registros válidos (VFU-0091, VFU-0092, VFU-0093) debe haber quedado guardado en la BD.
        assertEquals(0, vulnerabilityRepository.count(), "El rollback transaccional debe dejar 0 vulnerabilidades en la BD");
        assertEquals(0, auditLogRepository.count(), "El rollback transaccional debe dejar 0 registros de auditoría en la BD");
    }
}
