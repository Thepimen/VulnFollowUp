package com.vulnfollowup.support;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Clase base para las pruebas de integración con PostgreSQL 15 real mediante Testcontainers.
 *
 * <ul>
 *   <li>Arranca una única instancia de {@code postgres:15-alpine} por JVM para acelerar la suite.</li>
 *   <li>Carga {@code database/schema/01_schema.sql} y {@code database/seed/02_seed_data.sql}
 *       con {@link OfficialDatabaseScripts#load(String, String, String)} antes de que Hibernate
 *       valide el esquema con {@code spring.jpa.hibernate.ddl-auto=validate}.</li>
 *   <li>Si Docker no está en ejecución, falla con un {@link IllegalStateException} descriptivo.</li>
 * </ul>
 */
@SpringBootTest
public abstract class AbstractPostgresIntegrationTest {

    @SuppressWarnings("resource")
    protected static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:15-alpine")
                    .withDatabaseName("vulnfollowup_test")
                    .withUsername("vfu_test")
                    .withPassword("vfu_test_pwd");

    private static volatile boolean initialized = false;

    @BeforeAll
    static synchronized void ensureContainerStarted() {
        startAndInitializeIfNeeded();
    }

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        startAndInitializeIfNeeded();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    private static synchronized void startAndInitializeIfNeeded() {
        if (initialized) {
            return;
        }
        if (!DockerClientFactory.instance().isDockerAvailable()) {
            throw new IllegalStateException(
                    "Se requiere Docker en ejecución para lanzar el contenedor postgres:15-alpine de las pruebas de integración.");
        }
        POSTGRES.start();
        OfficialDatabaseScripts.load(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword()
        );
        initialized = true;
    }
}
