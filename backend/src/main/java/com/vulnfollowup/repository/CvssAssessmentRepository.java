package com.vulnfollowup.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vulnfollowup.model.CvssAssessment;

/**
 * Repositorio JPA para el histórico de evaluaciones CVSS de las vulnerabilidades (tabla cvss_assessments).
 */
@Repository
public interface CvssAssessmentRepository extends JpaRepository<CvssAssessment, Integer> {

    // Histórico de evaluaciones de una vulnerabilidad, de la más antigua a la más reciente
    List<CvssAssessment> findByVulnerabilityIdOrderByAssessedAtAscIdAsc(Integer vulnerabilityId);

    // Obtiene la evaluación CVSS marcada actualmente como vigente (is_current = true)
    Optional<CvssAssessment> findByVulnerabilityIdAndCurrentTrue(Integer vulnerabilityId);

    // Cuenta las evaluaciones marcadas como vigentes (debe haber como máximo una)
    long countByVulnerabilityIdAndCurrentTrue(Integer vulnerabilityId);
}
