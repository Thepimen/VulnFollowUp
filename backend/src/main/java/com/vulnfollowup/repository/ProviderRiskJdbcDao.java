package com.vulnfollowup.repository;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Component;

import com.vulnfollowup.dto.ProviderDoraRiskReportDto;

/**
 * DAO implementado con JDBC puro ({@link Connection}, {@link PreparedStatement}, {@link ResultSet})
 * para demostrar el dominio del bloque JDBC de Acceso a Datos (2.º DAM) y poder compararlo con
 * Hibernate/JPA en la defensa ante el tribunal.
 *
 * <p>Incluye:</p>
 * <ul>
 *   <li>Consultas parametrizadas con {@code ?} ({@link PreparedStatement}) para prevenir inyección SQL
 *       y calcular métricas agregadas de riesgo DORA por proveedor TIC ({@code COUNT}, {@code MAX},
 *       {@code FILTER}, {@code LEFT JOIN}, {@code GROUP BY}).</li>
 *   <li>Gestión manual de transacciones JDBC ({@code setAutoCommit(false)}, {@code commit()} y
 *       {@code rollback()}) para actualizar la fecha de revisión contractual de un proveedor.</li>
 * </ul>
 */
@Component
public class ProviderRiskJdbcDao {

    private static final String BASE_PROVIDER_RISK_SQL = """
            SELECT
                p.id AS provider_id,
                p.provider_code,
                p.name AS provider_name,
                p.criticality,
                p.is_critical_third_party,
                p.review_date,
                COUNT(DISTINCT a.id) AS total_assets,
                COUNT(DISTINCT v.id) FILTER (
                    WHERE v.status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN')
                      AND v.severity IN ('HIGH', 'CRITICAL')
                ) AS open_high_critical_vulns,
                COALESCE(
                    MAX(v.cvss_score) FILTER (
                        WHERE v.status IN ('ABIERTA', 'PENDIENTE DE REMEDIACIÓN')
                    ),
                    0.0
                ) AS max_cvss_score
            FROM ict_providers p
            LEFT JOIN assets a ON a.provider_id = p.id
            LEFT JOIN vulnerability_assets va ON va.asset_id = a.id
            LEFT JOIN vulnerabilities v ON v.id = va.vulnerability_id
            """;

    private final DataSource dataSource;

    public ProviderRiskJdbcDao(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Obtiene el informe de riesgo DORA de un proveedor TIC concreto (por ejemplo, id 5 = HostingSur S.L.)
     * usando {@link PreparedStatement} con parámetro posicional {@code ?}.
     */
    public Optional<ProviderDoraRiskReportDto> findProviderRiskReportById(Integer providerId) {
        if (providerId == null) {
            throw new IllegalArgumentException("El id del proveedor TIC es obligatorio");
        }
        String sql = BASE_PROVIDER_RISK_SQL + """
                WHERE p.id = ?
                GROUP BY p.id, p.provider_code, p.name, p.criticality, p.is_critical_third_party, p.review_date
                """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
                return Optional.empty();
            }
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Error JDBC al consultar el informe de riesgo DORA del proveedor " + providerId, e);
        }
    }

    /**
     * Obtiene el informe de riesgo DORA de todos los proveedores TIC ordenados de mayor a menor exposición.
     */
    public List<ProviderDoraRiskReportDto> findAllProviderRiskReports() {
        String sql = BASE_PROVIDER_RISK_SQL + """
                GROUP BY p.id, p.provider_code, p.name, p.criticality, p.is_critical_third_party, p.review_date
                ORDER BY open_high_critical_vulns DESC, max_cvss_score DESC, p.id ASC
                """;

        List<ProviderDoraRiskReportDto> reports = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                reports.add(mapRow(rs));
            }
            return reports;
        } catch (SQLException e) {
            throw new IllegalStateException("Error JDBC al listar informes de riesgo DORA de proveedores", e);
        }
    }

    /**
     * Actualiza la fecha de revisión DORA ({@code review_date}) de un proveedor TIC gestionando la
     * transacción manualmente con JDBC ({@code setAutoCommit(false)}, {@code commit()} y {@code rollback()}).
     */
    public void updateProviderReviewDateManualTx(Integer providerId, LocalDate newReviewDate) {
        if (providerId == null || newReviewDate == null) {
            throw new IllegalArgumentException("El id del proveedor y la nueva fecha de revisión son obligatorios");
        }
        String updateSql = "UPDATE ict_providers SET review_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

        try (Connection conn = dataSource.getConnection()) {
            boolean previousAutoCommit = conn.getAutoCommit();
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(updateSql)) {
                ps.setDate(1, Date.valueOf(newReviewDate));
                ps.setInt(2, providerId);
                int updatedRows = ps.executeUpdate();
                if (updatedRows == 0) {
                    throw new IllegalArgumentException("No existe el proveedor TIC con id: " + providerId);
                }
                conn.commit();
            } catch (Exception ex) {
                conn.rollback();
                if (ex instanceof RuntimeException runtimeEx) {
                    throw runtimeEx;
                }
                throw new IllegalStateException("Rollback manual JDBC ejecutado tras error: " + ex.getMessage(), ex);
            } finally {
                conn.setAutoCommit(previousAutoCommit);
            }
        } catch (SQLException e) {
            throw new IllegalStateException("Error en la conexión JDBC manual: " + e.getMessage(), e);
        }
    }

    private static ProviderDoraRiskReportDto mapRow(ResultSet rs) throws SQLException {
        Date sqlReviewDate = rs.getDate("review_date");
        BigDecimal maxScore = rs.getBigDecimal("max_cvss_score");
        return new ProviderDoraRiskReportDto(
                rs.getInt("provider_id"),
                rs.getString("provider_code"),
                rs.getString("provider_name"),
                rs.getString("criticality"),
                rs.getBoolean("is_critical_third_party"),
                sqlReviewDate != null ? sqlReviewDate.toLocalDate() : null,
                rs.getInt("total_assets"),
                rs.getInt("open_high_critical_vulns"),
                maxScore != null ? maxScore : new BigDecimal("0.0")
        );
    }
}
