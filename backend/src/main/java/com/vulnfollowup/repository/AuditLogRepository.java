package com.vulnfollowup.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vulnfollowup.model.AuditLog;

/**
 * Repositorio JPA para consultar y registrar el historial de auditoría (tabla audit_logs).
 * La tabla es de solo inserción: ningún código debe llamar a los métodos delete* de este repositorio.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    // Cuenta los registros de auditoría de una vulnerabilidad
    long countByVulnerabilityId(Integer vulnerabilityId);

    // Comprueba si una vulnerabilidad tiene historial de auditoría (impide su borrado)
    boolean existsByVulnerabilityId(Integer vulnerabilityId);

    // Historial de una vulnerabilidad en orden cronológico
    List<AuditLog> findByVulnerabilityIdOrderByCreatedAtAscIdAsc(Integer vulnerabilityId);
}
