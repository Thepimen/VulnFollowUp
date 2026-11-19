package com.vulnfollowup.controller;

import com.vulnfollowup.config.*;
import com.vulnfollowup.dto.*;
import com.vulnfollowup.model.*;
import com.vulnfollowup.model.enums.*;
import com.vulnfollowup.repository.*;
import com.vulnfollowup.security.*;
import com.vulnfollowup.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {
        AuthController.class,
        VulnerabilityController.class,
        AssetController.class,
        ProviderController.class,
        DashboardController.class,
        ReportController.class
})
@Import({
        SecurityConfig.class,
        SecurityCryptoConfig.class,
        JwtTokenService.class,
        JwtAuthenticationFilter.class,
        GlobalExceptionHandler.class,
        PspConcurrencyAndProcessService.class
})
class RestApiAndSecurityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenService jwtService;

    @MockBean private AuthService authService;
    @MockBean private VulnerabilityService vulnService;
    @MockBean private UserRepository userRepo;
    @MockBean private AssetRepository assetRepo;
    @MockBean private TicProviderRepository provRepo;
    @MockBean private ProviderRiskJdbcDao provDao;
    @MockBean private CvssAssessmentRepository assessmentRepo;
    @MockBean private AuditLogRepository auditRepo;

    private User adminUser;
    private User analystUser;
    private User viewerUser;

    @BeforeEach
    void initUsers() {
        adminUser = new User("admin_dora", "ciso@vfu.eu", "Elena Vazquez", "$2b$12$hash", UserRole.ADMIN);
        adminUser.setId(1);
        analystUser = new User("analyst_soc", "carlos@vfu.eu", "Carlos Mendez", "$2b$12$hash", UserRole.ANALYST);
        analystUser.setId(2);
        viewerUser = new User("auditor_viewer", "javier@vfu.eu", "Javier Ortega", "$2b$12$hash", UserRole.VIEWER);
        viewerUser.setId(4);

        when(userRepo.findByUsername("admin_dora")).thenReturn(Optional.of(adminUser));
        when(userRepo.findByUsername("analyst_soc")).thenReturn(Optional.of(analystUser));
        when(userRepo.findByUsername("auditor_viewer")).thenReturn(Optional.of(viewerUser));
    }

    @Test
    @DisplayName("Login devuelve JWT valido y rechaza credenciales erroneas con 401")
    void loginSuccessAndFailure() throws Exception {
        when(authService.login("admin_dora", "AdminDora#2026!"))
                .thenReturn(new AuthResponse(1, "admin_dora", UserRole.ADMIN, true));
        when(authService.login("admin_dora", "wrong"))
                .thenThrow(new IllegalArgumentException(AuthService.INVALID_CREDENTIALS));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin_dora\",\"password\":\"AdminDora#2026!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin_dora\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Peticiones sin token o con JWT alg=none/manipulado devuelven 401")
    void rejectsMissingOrInvalidJwt() throws Exception {
        mockMvc.perform(get("/api/vulnerabilities"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        String algNoneHeader = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"admin_dora\",\"role\":\"ADMIN\",\"exp\":9999999999}".getBytes(StandardCharsets.UTF_8));
        String forgedToken = algNoneHeader + "." + payload + ".";

        mockMvc.perform(get("/api/vulnerabilities")
                        .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        String realToken = jwtService.generateToken(adminUser);
        String tamperedToken = realToken.substring(0, realToken.length() - 4) + "AAAA";
        mockMvc.perform(get("/api/vulnerabilities")
                        .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("RBAC: VIEWER solo lectura, ANALYST bloqueado en CERRADA/providers, ADMIN autorizado")
    void rbacMatrixEnforcement() throws Exception {
        String viewerJwt = jwtService.generateToken(viewerUser);
        String analystJwt = jwtService.generateToken(analystUser);
        String adminJwt = jwtService.generateToken(adminUser);

        Vulnerability sample = new Vulnerability();
        sample.setId(12);
        sample.setInternalCode("VFU-0012");
        sample.setTitle("RCE en pasarela de pagos");
        sample.setDescription("Descripcion tecnica");
        sample.setStatus(VulnerabilityStatus.PENDIENTE_DE_REMEDIACION);
        sample.applyCvssSnapshot(CvssVersion.V3_1, "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                new BigDecimal("9.8"), CvssSeverity.CRITICAL);

        TicProvider hostingSur = new TicProvider("PROV-005", "HostingSur S.L.", "Pasarela pagos",
                ProviderCriticality.HIGH, "CTR-HS-05", LocalDate.of(2026, 3, 15), "sec@hostingsur.es");
        hostingSur.setId(5);

        when(vulnService.findAllWithDetails()).thenReturn(List.of(sample));
        when(provRepo.findById(5)).thenReturn(Optional.of(hostingSur));
        when(provDao.findProviderRiskReportById(5)).thenReturn(Optional.of(
                new ProviderDoraRiskReportDto(5, "PROV-005", "HostingSur S.L.", "HIGH", true,
                        LocalDate.of(2026, 3, 15), 1, 1, new BigDecimal("9.8"))));
        when(assetRepo.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/vulnerabilities").header("Authorization", "Bearer " + viewerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].internalCode").value("VFU-0012"));

        mockMvc.perform(get("/api/providers/5/report").header("Authorization", "Bearer " + viewerJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doraRiskStatus").value("AT_RISK"));

        String validCreateJson = """
                {
                  "internalCode": "VFU-0050",
                  "cveId": "CVE-2026-90050",
                  "title": "Fallo critico de validacion",
                  "description": "Descripcion detallada de prueba tecnica",
                  "cvssVersion": "3.1",
                  "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                  "cvssScore": 9.8,
                  "severity": "CRITICAL",
                  "affectedAssetIds": [8]
                }
                """;

        mockMvc.perform(post("/api/vulnerabilities")
                        .header("Authorization", "Bearer " + viewerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        mockMvc.perform(post("/api/assets")
                        .header("Authorization", "Bearer " + viewerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assetCode\":\"AST-01\",\"name\":\"API\",\"assetType\":\"API_SERVICE\",\"criticality\":\"HIGH\",\"environment\":\"PRODUCTION\",\"ownerDepartment\":\"IT\",\"providerId\":5}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        mockMvc.perform(patch("/api/vulnerabilities/12/status")
                        .header("Authorization", "Bearer " + viewerJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newStatus\":\"RESUELTA\",\"justification\":\"Intento de cambio por viewer\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        when(vulnService.createVulnerability(any(VulnerabilityCreateCommand.class), any(User.class)))
                .thenReturn(sample);
        mockMvc.perform(post("/api/vulnerabilities")
                        .header("Authorization", "Bearer " + analystJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.internalCode").value("VFU-0012"));

        when(vulnService.changeStatus(eq(12), eq(VulnerabilityStatus.RESUELTA), anyString(), any(User.class)))
                .thenReturn(sample);
        mockMvc.perform(patch("/api/vulnerabilities/12/status")
                        .header("Authorization", "Bearer " + analystJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newStatus\":\"RESUELTA\",\"justification\":\"Parche desplegado y verificado\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/vulnerabilities/12/status")
                        .header("Authorization", "Bearer " + analystJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newStatus\":\"CERRADA\",\"justification\":\"Intento de cierre por analista\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        String providerJson = """
                {
                  "providerCode": "PROV-006",
                  "name": "SecCloud Iberia S.L.",
                  "providedService": "Gestion Kubernetes DORA",
                  "criticality": "HIGH",
                  "contractReference": "CTR-2026-06",
                  "contractStatus": "ACTIVE",
                  "reviewDate": "2026-10-01",
                  "contactEmail": "dora@seccloud.es",
                  "countryCode": "ES",
                  "slaAvailabilityPct": 99.95
                }
                """;

        mockMvc.perform(post("/api/providers")
                        .header("Authorization", "Bearer " + analystJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(providerJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        when(vulnService.changeStatus(eq(12), eq(VulnerabilityStatus.CERRADA), anyString(), any(User.class)))
                .thenReturn(sample);
        mockMvc.perform(patch("/api/vulnerabilities/12/status")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newStatus\":\"CERRADA\",\"justification\":\"Cierre auditado por CISO admin\"}"))
                .andExpect(status().isOk());

        when(provRepo.saveAndFlush(any(TicProvider.class))).thenAnswer(inv -> {
            TicProvider p = inv.getArgument(0);
            p.setId(6);
            return p;
        });
        mockMvc.perform(post("/api/providers")
                        .header("Authorization", "Bearer " + adminJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(providerJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.providerCode").value("PROV-006"));

        mockMvc.perform(get("/api/reports/export?format=CSV")
                        .header("Authorization", "Bearer " + viewerJwt))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_ROLE"));

        mockMvc.perform(get("/api/reports/export?format=CSV")
                        .header("Authorization", "Bearer " + analystJwt))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("VFU-0012")));
    }

    @Test
    @DisplayName("Incoherencia CVSS (9.8 con LOW) devuelve 400 CVSS_COHERENCE_VIOLATION")
    void cvssIncoherenceReturns400() throws Exception {
        String analystJwt = jwtService.generateToken(analystUser);
        when(vulnService.createVulnerability(any(VulnerabilityCreateCommand.class), any(User.class)))
                .thenAnswer(inv -> {
                    VulnerabilityCreateCommand cmd = inv.getArgument(0);
                    CvssValidator.validate(cmd.cvssVersion(), cmd.cvssVector(), cmd.cvssScore(), cmd.severity());
                    return new Vulnerability();
                });

        String badCvssJson = """
                {
                  "internalCode": "VFU-0094",
                  "cveId": "CVE-2026-90094",
                  "title": "Vulnerabilidad con CVSS incoherente",
                  "description": "Nota 9.8 declarada como severidad LOW",
                  "cvssVersion": "3.1",
                  "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                  "cvssScore": 9.8,
                  "severity": "LOW",
                  "affectedAssetIds": [8]
                }
                """;

        mockMvc.perform(post("/api/vulnerabilities")
                        .header("Authorization", "Bearer " + analystJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badCvssJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CVSS_COHERENCE_VIOLATION"));
    }
}
