package com.vulnfollowup.model;

import com.vulnfollowup.model.converter.CvssSeverityConverter;
import com.vulnfollowup.model.converter.CvssVersionConverter;
import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.Objects;

/**
 * Evaluación CVSS de una vulnerabilidad (historial 1:N).
 * Se mapea contra la tabla {@code cvss_assessments} del esquema oficial.
 * Solo una evaluación por vulnerabilidad puede estar vigente ({@code is_current = TRUE}),
 * restricción que garantiza el índice {@code uq_cvss_assessments_one_current} de la BD.
 */
@Entity
@Table(name = "cvss_assessments")
public class CvssAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id;

    // Vulnerabilidad evaluada: cada evaluación pertenece exactamente a una vulnerabilidad
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vulnerability_id", nullable = false)
    private Vulnerability vulnerability;

    // Usuario que realizó la evaluación; la columna admite NULL
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by")
    private User assessedBy;

    // Versión del estándar CVSS (Valor_BD "3.1" o "4.0")
    @Convert(converter = CvssVersionConverter.class)
    @Column(name = "cvss_version", length = 10, nullable = false)
    private CvssVersion cvssVersion;

    // Vector técnico oficial (ej: CVSS:3.1/AV:N/AC:L/...)
    @Column(name = "cvss_vector", length = 180, nullable = false)
    private String cvssVector;

    // Nota numérica de 0.0 a 10.0 con precisión NUMERIC(3,1)
    @Column(name = "cvss_score", nullable = false, precision = 3, scale = 1)
    private BigDecimal cvssScore;

    // Severidad (NONE, LOW, MEDIUM, HIGH, CRITICAL)
    @Convert(converter = CvssSeverityConverter.class)
    @Column(name = "severity", length = 20, nullable = false)
    private CvssSeverity severity;

    // Indica si es la evaluación vigente de la vulnerabilidad
    @Column(name = "is_current", nullable = false)
    private boolean current = true;

    // Momento de la evaluación, asignado por Hibernate al insertar
    @CreationTimestamp
    @Column(name = "assessed_at", nullable = false, updatable = false)
    private OffsetDateTime assessedAt;

    public CvssAssessment() {
    }

    public CvssAssessment(
            Vulnerability vulnerability,
            User assessedBy,
            CvssVersion cvssVersion,
            String cvssVector,
            BigDecimal cvssScore,
            CvssSeverity severity,
            boolean current
    ) {
        this.vulnerability = vulnerability;
        this.assessedBy = assessedBy;
        this.cvssVersion = cvssVersion;
        this.cvssVector = cvssVector;
        setCvssScore(cvssScore);
        this.severity = severity;
        this.current = current;
    }

    /**
     * Crea la Evaluacion_Vigente copiando la Instantanea_CVSS de la vulnerabilidad.
     * Solo asigna el campo {@code vulnerability}; no se añade a {@code vulnerability.assessments}
     * porque las evaluaciones se guardan con su propio repositorio, sin cascada.
     */
    public static CvssAssessment currentFor(Vulnerability vulnerability, User assessor) {
        Objects.requireNonNull(vulnerability, "vulnerability");
        return new CvssAssessment(
                vulnerability,
                assessor,
                vulnerability.getCvssVersion(),
                vulnerability.getCvssVector(),
                vulnerability.getCvssScore(),
                vulnerability.getSeverity(),
                true
        );
    }

    public Integer getId() {
        return id;
    }

    public Vulnerability getVulnerability() {
        return vulnerability;
    }

    public void setVulnerability(Vulnerability vulnerability) {
        this.vulnerability = vulnerability;
    }

    public User getAssessedBy() {
        return assessedBy;
    }

    public void setAssessedBy(User assessedBy) {
        this.assessedBy = assessedBy;
    }

    public CvssVersion getCvssVersion() {
        return cvssVersion;
    }

    public void setCvssVersion(CvssVersion cvssVersion) {
        this.cvssVersion = cvssVersion;
    }

    public String getCvssVector() {
        return cvssVector;
    }

    public void setCvssVector(String cvssVector) {
        this.cvssVector = cvssVector;
    }

    public BigDecimal getCvssScore() {
        return cvssScore;
    }

    // Normaliza la nota a un decimal (escala de la columna NUMERIC(3,1))
    public void setCvssScore(BigDecimal cvssScore) {
        this.cvssScore = cvssScore != null ? cvssScore.setScale(1, RoundingMode.HALF_UP) : null;
    }

    public CvssSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(CvssSeverity severity) {
        this.severity = severity;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }

    public OffsetDateTime getAssessedAt() {
        return assessedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CvssAssessment that)) return false;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
