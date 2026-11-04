package com.vulnfollowup.repository;

import com.vulnfollowup.model.CvssAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio JPA para consultar o guardar evaluaciones CVSS de vulnerabilidades.
 */
@Repository
public interface CvssAssessmentRepository extends JpaRepository<CvssAssessment, Long> {

    // Obtiene la evaluación CVSS asociada al ID de una vulnerabilidad
    Optional<CvssAssessment> findByVulnerabilityId(Long vulnerabilityId);
}
