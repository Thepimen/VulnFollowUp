package com.vulnfollowup.repository;

import com.vulnfollowup.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA para consultar y registrar el historial de auditoría ("Remediation_Audit").
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Obtiene el historial completo de cambios de estado de una vulnerabilidad ordenado del más reciente al más antiguo
    List<AuditLog> findByVulnerabilityIdOrderByAuditDateDesc(Long vulnerabilityId);

    // Obtiene todas las acciones de auditoría realizadas por un usuario concreto
    List<AuditLog> findByUserId(Long userId);
}
