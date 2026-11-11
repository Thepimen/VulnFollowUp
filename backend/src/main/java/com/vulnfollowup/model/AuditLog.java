package com.vulnfollowup.model;

import java.time.OffsetDateTime;
import java.util.Objects;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

import com.vulnfollowup.model.converter.VulnerabilityStatusConverter;
import com.vulnfollowup.model.enums.VulnerabilityStatus;

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

/**
 * Registro de auditoría: una fila por cada acción relevante sobre una vulnerabilidad
 * (alta o cambio de estado), con quién la hizo, los estados anterior y nuevo, la
 * justificación y la fecha.
 *
 * <p>Mapea la tabla {@code audit_logs}, que es de <b>solo inserción</b>: el Esquema_Oficial
 * define triggers ({@code fn_audit_logs_append_only}) que rechazan cualquier UPDATE o DELETE
 * sobre sus filas. Por eso la entidad está anotada con {@link Immutable}: Hibernate nunca
 * genera UPDATE para ella aunque se modifique el objeto en memoria (el "dirty checking" la
 * ignora), y así no se dispara el trigger por accidente al hacer {@code flush}.</p>
 *
 * <p>Por la misma razón no hay setters: los datos se fijan una sola vez en el constructor.</p>
 */
@Entity
@Immutable
@Table(name = "audit_logs")
public class AuditLog {

    /** Tipo de acción usado al registrar el alta de una vulnerabilidad. */
    public static final String ACTION_VULNERABILITY_CREATED = "VULNERABILITY_CREATED";

    /** Tipo de acción usado al registrar un cambio de estado. */
    public static final String ACTION_STATUS_TRANSITION = "STATUS_TRANSITION";

    /** Tipo de acción usado al registrar una re-evaluación CVSS (1:N en cvss_assessments). */
    public static final String ACTION_CVSS_REASSESSMENT = "CVSS_REASSESSMENT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id;

    // Vulnerabilidad auditada. Es opcional porque la columna admite NULL en el esquema.
    // LAZY: la vulnerabilidad solo se carga si se accede a ella
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "vulnerability_id", nullable = true)
    private Vulnerability vulnerability;

    // Usuario que realizó la acción (obligatorio)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Tipo de acción: ACTION_VULNERABILITY_CREATED o ACTION_STATUS_TRANSITION
    @Column(name = "action_type", length = 40, nullable = false)
    private String actionType;

    // Estado antes de la acción (NULL en el alta, porque no había estado previo).
    // El convertidor guarda el texto exacto que admite la CHECK del esquema
    @Convert(converter = VulnerabilityStatusConverter.class)
    @Column(name = "previous_status", length = 30, nullable = true)
    private VulnerabilityStatus previousStatus;

    // Estado tras la acción. La columna admite NULL en el esquema, así que se mapea igual
    @Convert(converter = VulnerabilityStatusConverter.class)
    @Column(name = "new_status", length = 30, nullable = true)
    private VulnerabilityStatus newStatus;

    // Motivo o justificación técnica de la acción (obligatorio)
    @Column(name = "justification", columnDefinition = "text", nullable = false)
    private String justification;

    // Hibernate la rellena al insertar; nunca se actualiza
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    // Constructor sin argumentos exigido por JPA. Es protected para que el código de la
    // aplicación use siempre el constructor completo
    protected AuditLog() {
    }

    /**
     * Crea un registro de auditoría con todos sus datos.
     *
     * @param vulnerability  vulnerabilidad afectada (puede ser {@code null})
     * @param user           usuario que realiza la acción
     * @param actionType     tipo de acción ({@link #ACTION_VULNERABILITY_CREATED} o
     *                       {@link #ACTION_STATUS_TRANSITION})
     * @param previousStatus estado anterior ({@code null} en el alta)
     * @param newStatus      estado nuevo
     * @param justification  justificación de la acción
     */
    public AuditLog(Vulnerability vulnerability, User user, String actionType,
                    VulnerabilityStatus previousStatus, VulnerabilityStatus newStatus,
                    String justification) {
        this.vulnerability = vulnerability;
        this.user = user;
        this.actionType = actionType;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.justification = justification;
    }

    // ---- Solo getters (entidad inmutable) ----

    public Integer getId() {
        return id;
    }

    public Vulnerability getVulnerability() {
        return vulnerability;
    }

    public User getUser() {
        return user;
    }

    public String getActionType() {
        return actionType;
    }

    public VulnerabilityStatus getPreviousStatus() {
        return previousStatus;
    }

    public VulnerabilityStatus getNewStatus() {
        return newStatus;
    }

    public String getJustification() {
        return justification;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    // equals por id no nulo y hashCode constante por clase, igual que en el resto de entidades
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AuditLog that)) return false;
        return id != null && Objects.equals(id, that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
