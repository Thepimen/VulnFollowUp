package com.vulnfollowup.model;

import com.vulnfollowup.model.converter.VulnerabilityStatusConverter;
import com.vulnfollowup.model.enums.VulnerabilityStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad de auditoría (tabla "Remediation_Audit").
 * Registra cada cambio de estado en el ciclo de vida de una vulnerabilidad:
 * quién realizó el cambio (id_user), el estado anterior, el estado nuevo,
 * el motivo/justificación técnica y la fecha y hora exacta.
 */
@Entity
@Table(name = "\"Remediation_Audit\"")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    // Vulnerabilidad auditada (carga LAZY para evitar consultas innecesarias)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "id_vulnerability",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_vulnerability_audit")
    )
    private Vulnerability vulnerability;

    // Usuario que ejecutó la acción o el cambio de estado
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "id_user",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_audit")
    )
    private User user;

    // Motivo o justificación técnica del cambio de estado
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    // Estado previo de la vulnerabilidad (puede ser null cuando se registra por primera vez)
    @Convert(converter = VulnerabilityStatusConverter.class)
    @Column(name = "previous_status", length = 30)
    private VulnerabilityStatus previousStatus;

    // Nuevo estado tras la transición
    @Convert(converter = VulnerabilityStatusConverter.class)
    @Column(name = "new_status", length = 30, nullable = false)
    private VulnerabilityStatus newStatus;

    @Column(name = "audit_date", nullable = false)
    private LocalDateTime auditDate = LocalDateTime.now();

    public AuditLog() {
    }

    public AuditLog(
            Vulnerability vulnerability,
            User user,
            VulnerabilityStatus previousStatus,
            VulnerabilityStatus newStatus,
            String comment
    ) {
        this.vulnerability = vulnerability;
        this.user = user;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.comment = comment;
        this.auditDate = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.auditDate == null) {
            this.auditDate = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Vulnerability getVulnerability() {
        return vulnerability;
    }

    public void setVulnerability(Vulnerability vulnerability) {
        this.vulnerability = vulnerability;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public VulnerabilityStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(VulnerabilityStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public VulnerabilityStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(VulnerabilityStatus newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getAuditDate() {
        return auditDate;
    }

    public void setAuditDate(LocalDateTime auditDate) {
        this.auditDate = auditDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AuditLog auditLog)) return false;
        return id != null && Objects.equals(id, auditLog.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
