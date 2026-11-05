package com.vulnfollowup.model;

import com.vulnfollowup.model.converter.CvssSeverityConverter;
import com.vulnfollowup.model.converter.CvssVersionConverter;
import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Entidad que guarda el cálculo de puntuación CVSS (v3.1 o v4.0) de una vulnerabilidad.
 * Se mapea contra la tabla "CVSS_Assessment" de la base de datos.
 */
@Entity
@Table(name = "\"CVSS_Assessment\"")
public class CvssAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    // Versión del estándar CVSS empleada (3.1 o 4.0)
    @Convert(converter = CvssVersionConverter.class)
    @Column(name = "version", length = 10, nullable = false)
    private CvssVersion version;

    // Cadena con el vector técnico oficial (ej: CVSS:3.1/AV:N/AC:L/...)
    @Column(name = "vector", length = 150, nullable = false)
    private String baseVector;

    // Nota numérica del 0.0 al 10.0 con precisión exacta DECIMAL(3,1) en la BD
    @JdbcTypeCode(SqlTypes.NUMERIC)
    @Column(name = "score", nullable = false, precision = 3, scale = 1)
    private BigDecimal baseScore;

    // Nivel de gravedad en texto (NINGUNA, BAJA, MEDIA, ALTA, CRITICA)
    @Convert(converter = CvssSeverityConverter.class)
    @Column(name = "severity", length = 20, nullable = false)
    private CvssSeverity severity;

    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate = LocalDate.now();

    // Clave foránea id_vulnerability que une esta evaluación con su vulnerabilidad (1:1 en LAZY)
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "id_vulnerability",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_vulnerability_cvss")
    )
    private Vulnerability vulnerability;

    public CvssAssessment() {
    }

    public CvssAssessment(
            CvssVersion version,
            String baseVector,
            BigDecimal baseScore,
            CvssSeverity severity,
            LocalDate assessmentDate,
            Vulnerability vulnerability
    ) {
        this.version = version;
        this.baseVector = baseVector;
        this.baseScore = baseScore != null ? baseScore.setScale(1, RoundingMode.HALF_UP) : null;
        this.severity = severity;
        this.assessmentDate = assessmentDate != null ? assessmentDate : LocalDate.now();
        this.vulnerability = vulnerability;
    }

    public CvssAssessment(
            CvssVersion version,
            String baseVector,
            Double baseScore,
            CvssSeverity severity,
            LocalDate assessmentDate,
            Vulnerability vulnerability
    ) {
        this(
                version,
                baseVector,
                baseScore != null ? BigDecimal.valueOf(baseScore).setScale(1, RoundingMode.HALF_UP) : null,
                severity,
                assessmentDate,
                vulnerability
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CvssVersion getVersion() {
        return version;
    }

    public void setVersion(CvssVersion version) {
        this.version = version;
    }

    public String getBaseVector() {
        return baseVector;
    }

    public void setBaseVector(String baseVector) {
        this.baseVector = baseVector;
    }

    public BigDecimal getBaseScore() {
        return baseScore;
    }

    public void setBaseScore(BigDecimal baseScore) {
        this.baseScore = baseScore != null ? baseScore.setScale(1, RoundingMode.HALF_UP) : null;
    }

    public void setBaseScore(Double baseScore) {
        this.baseScore = baseScore != null ? BigDecimal.valueOf(baseScore).setScale(1, RoundingMode.HALF_UP) : null;
    }

    public CvssSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(CvssSeverity severity) {
        this.severity = severity;
    }

    public LocalDate getAssessmentDate() {
        return assessmentDate;
    }

    public void setAssessmentDate(LocalDate assessmentDate) {
        this.assessmentDate = assessmentDate;
    }

    public Vulnerability getVulnerability() {
        return vulnerability;
    }

    public void setVulnerability(Vulnerability vulnerability) {
        this.vulnerability = vulnerability;
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
