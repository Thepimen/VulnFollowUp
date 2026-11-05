package com.vulnfollowup.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.vulnfollowup.model.enums.ProviderCriticality;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/**
 * Entidad que representa a los proveedores TIC (módulo SGE, Reglamento DORA capítulo V).
 * Se mapea contra la tabla {@code ict_providers} del Esquema_Oficial (14 columnas).
 */
@Entity
@Table(name = "ict_providers")
public class TicProvider {

    // La PK es SERIAL (INTEGER) en PostgreSQL, por eso el id es Integer
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id;

    @Column(name = "provider_code", length = 20, nullable = false, unique = true)
    private String providerCode;

    @Column(name = "name", length = 120, nullable = false, unique = true)
    private String name;

    @Column(name = "provided_service", length = 150, nullable = false)
    private String providedService;

    // Se traduce con ProviderCriticalityConverter (autoApply): LOW, MEDIUM, HIGH o CRITICAL
    @Column(name = "criticality", length = 20, nullable = false)
    private ProviderCriticality criticality;

    // Marca de proveedor tercero crítico (DORA); la CHECK exige criticidad HIGH o CRITICAL
    @Column(name = "is_critical_third_party", nullable = false)
    private boolean criticalThirdParty = false;

    @Column(name = "contract_reference", length = 100, nullable = false)
    private String contractReference;

    // Texto libre vigilado por la CHECK del esquema (ACTIVE, UNDER_REVIEW, SUSPENDED, TERMINATED)
    @Column(name = "contract_status", length = 30, nullable = false)
    private String contractStatus = "ACTIVE";

    // Fecha de revisión del contrato (clave para auditar proveedores en DORA)
    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Column(name = "contact_email", length = 120, nullable = false)
    private String contactEmail;

    // CHAR(2): PostgreSQL informa bpchar como Types.CHAR; sin esta anotación el validador esperaría VARCHAR
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "country_code", length = 2, nullable = false)
    private String countryCode = "ES";

    @Column(name = "sla_availability_pct", precision = 5, scale = 2, nullable = false)
    private BigDecimal slaAvailabilityPct = new BigDecimal("99.90");

    // Hibernate inserta la columna explícitamente, así que el DEFAULT de la BD no se aplicaría
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // Lado inverso de solo lectura de assets.provider_id; el lado propietario es Asset.provider
    @OneToMany(mappedBy = "provider", fetch = FetchType.LAZY)
    private Set<Asset> assets = new LinkedHashSet<>();

    public TicProvider() {
    }

    public TicProvider(
            String providerCode,
            String name,
            String providedService,
            ProviderCriticality criticality,
            String contractReference,
            LocalDate reviewDate,
            String contactEmail
    ) {
        this.providerCode = providerCode;
        this.name = name;
        this.providedService = providedService;
        this.criticality = criticality;
        this.contractReference = contractReference;
        this.reviewDate = reviewDate;
        this.contactEmail = contactEmail;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getProviderCode() {
        return providerCode;
    }

    public void setProviderCode(String providerCode) {
        this.providerCode = providerCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProvidedService() {
        return providedService;
    }

    public void setProvidedService(String providedService) {
        this.providedService = providedService;
    }

    public ProviderCriticality getCriticality() {
        return criticality;
    }

    public void setCriticality(ProviderCriticality criticality) {
        this.criticality = criticality;
    }

    public boolean isCriticalThirdParty() {
        return criticalThirdParty;
    }

    public void setCriticalThirdParty(boolean criticalThirdParty) {
        this.criticalThirdParty = criticalThirdParty;
    }

    public String getContractReference() {
        return contractReference;
    }

    public void setContractReference(String contractReference) {
        this.contractReference = contractReference;
    }

    public String getContractStatus() {
        return contractStatus;
    }

    public void setContractStatus(String contractStatus) {
        this.contractStatus = contractStatus;
    }

    public LocalDate getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDate reviewDate) {
        this.reviewDate = reviewDate;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public BigDecimal getSlaAvailabilityPct() {
        return slaAvailabilityPct;
    }

    public void setSlaAvailabilityPct(BigDecimal slaAvailabilityPct) {
        this.slaAvailabilityPct = slaAvailabilityPct;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Vista no modificable: la relación se gestiona desde Asset.setProvider
    public Set<Asset> getAssets() {
        return Collections.unmodifiableSet(assets);
    }

    // Igualdad por id: dos instancias sin persistir nunca son iguales
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TicProvider that)) return false;
        return id != null && Objects.equals(id, that.id);
    }

    // hashCode constante por clase para que no cambie al asignarse el id tras el INSERT
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
