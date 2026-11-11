package com.vulnfollowup.support;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import javax.sql.DataSource;

/**
 * Cargador de los scripts SQL oficiales ({@code 01_schema.sql} y {@code 02_seed_data.sql})
 * para las pruebas de integración con PostgreSQL 15 (Testcontainers).
 *
 * <p><b>Importante (Acceso a Datos):</b> Cada fichero se lee completo en UTF-8 y se ejecuta
 * en una única llamada a {@link Statement#execute(String)} sobre el driver JDBC de PostgreSQL.
 * No se utiliza {@code ScriptUtils} de Spring porque su particionado por punto y coma ({@code ;})
 * rompe el cuerpo de la función PL/pgSQL {@code fn_audit_logs_append_only()} delimitada por {@code $$}.</p>
 */
public final class OfficialDatabaseScripts {

    public static final Path DEFAULT_SCHEMA_PATH = resolveScriptPath("database/schema/01_schema.sql");
    public static final Path DEFAULT_SEED_PATH = resolveScriptPath("database/seed/02_seed_data.sql");
    public static final Path DEFAULT_ROLLBACK_JSON_PATH = resolveScriptPath("data/vulnerabilities_invalid_rollback_test.json");

    private OfficialDatabaseScripts() {
    }

    /**
     * Carga el esquema oficial ({@code 01_schema.sql}) y las semillas ({@code 02_seed_data.sql})
     * abriendo una conexión JDBC directa contra el contenedor PostgreSQL.
     */
    public static void load(String jdbcUrl, String username, String password) {
        load(jdbcUrl, username, password, DEFAULT_SCHEMA_PATH, DEFAULT_SEED_PATH);
    }

    /**
     * Carga los scripts indicados abriendo una conexión JDBC directa.
     */
    public static void load(String jdbcUrl, String username, String password, Path schemaPath, Path seedPath) {
        String schemaSql = readSqlFile("Esquema_Oficial", schemaPath);
        String seedSql = readSqlFile("Seed_Oficial", seedPath);

        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password)) {
            executeScript(connection, "Esquema_Oficial (" + schemaPath + ")", schemaSql);
            executeScript(connection, "Seed_Oficial (" + seedPath + ")", seedSql);
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Error conectando o ejecutando scripts oficiales en PostgreSQL: " + e.getMessage(), e);
        }
    }

    /**
     * Restaura por completo el esquema oficial y el seed usando el {@link DataSource} de Spring.
     * Útil tras pruebas que hacen commit o rollback explícito en varias transacciones.
     */
    public static void reset(DataSource dataSource) {
        String schemaSql = readSqlFile("Esquema_Oficial", DEFAULT_SCHEMA_PATH);
        String seedSql = readSqlFile("Seed_Oficial", DEFAULT_SEED_PATH);

        try (Connection connection = dataSource.getConnection()) {
            executeScript(connection, "Esquema_Oficial (" + DEFAULT_SCHEMA_PATH + ")", schemaSql);
            executeScript(connection, "Seed_Oficial (" + DEFAULT_SEED_PATH + ")", seedSql);
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Error al restaurar el Esquema_Oficial y el Seed_Oficial: " + e.getMessage(), e);
        }
    }

    /**
     * Lee el contenido íntegro de un fichero SQL en UTF-8 o lanza {@link IllegalStateException}
     * nombrando el fichero si no existe.
     */
    public static String readSqlFile(String label, Path path) {
        if (path == null || !Files.isRegularFile(path)) {
            throw new IllegalStateException(
                    "No se encontró el fichero SQL de " + label + " en la ruta: " + path);
        }
        try {
            return Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo leer el fichero SQL de " + label + " (" + path + "): " + e.getMessage(), e);
        }
    }

    private static void executeScript(Connection connection, String label, String sql) {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Error ejecutando " + label + ": " + e.getMessage(), e);
        }
    }

    /**
     * Resuelve la ruta relativa tanto si Maven se lanza desde {@code backend/} como desde la raíz del monorepo.
     */
    private static Path resolveScriptPath(String relativeFromRoot) {
        Path fromBackendDir = Path.of("..", relativeFromRoot);
        if (Files.exists(fromBackendDir)) {
            return fromBackendDir.normalize();
        }
        Path fromRepoRoot = Path.of("VulnFollowUp", relativeFromRoot);
        if (Files.exists(fromRepoRoot)) {
            return fromRepoRoot.normalize();
        }
        return Path.of(relativeFromRoot).normalize();
    }
}
