package com.vulnfollowup.model;

import com.vulnfollowup.model.enums.ProviderCriticality;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Entidad que representa a los proveedores tecnológicos (requisito del módulo SGE y normativa DORA).
 * Se mapea contra la tabla "IT_Provider" respetando las comillas del script SQL.
 */
@Entity
@Table(name = "\"IT_Provider\"")
public class TicProvider {

    // Clave primaria autoincremental; usamos JdbcTypeCode INTEGER para que coincida con el tipo SERIAL de Postgres
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "provided_service", length = 150, nullable = false)
    private String providedService;

    // Guardamos el nombre del enum como texto (LOW, MEDIUM, HIGH, CRITICAL)
    @Enumerated(EnumType.STRING)
    @Column(name = "criticality", length = 20, nullable = false)
    private ProviderCriticality criticality;

    @Column(name = "contract", length = 100)
    private String contract;

    // Fecha de revisión del contrato (clave para auditar proveedores en DORA)
    @Column(name = "review_date")
    private LocalDate contractReviewDate;

    @Column(name = "contact", length = 100)
    private String contactEmail;

    // Relación 1:N con Asset. Usamos LAZY para no traer todos los activos de golpe si no los pedimos
    @OneToMany(mappedBy = "ticProvider", fetch = FetchType.LAZY)
    private Set<Asset> assets = new LinkedHashSet<>();

    public TicProvider() {
    }

    public TicProvider(
            String name,
            String providedService,
            ProviderCriticality criticality,
            String contract,
            LocalDate contractReviewDate,
            String contactEmail
    ) {
        this.name = name;
        this.providedService = providedService;
        this.criticality = criticality;
        this.contract = contract;
        this.contractReviewDate = contractReviewDate;
        this.contactEmail = contactEmail;
    }

    // Métodos auxiliares para mantener sincronizados el proveedor y sus activos en memoria
    public void addAsset(Asset asset) {
        this.assets.add(asset);
        asset.setTicProvider(this);
    }

    public void removeAsset(Asset asset) {
        this.assets.remove(asset);
        asset.setTicProvider(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getContract() {
        return contract;
    }

    public void setContract(String contract) {
        this.contract = contract;
    }

    public LocalDate getContractReviewDate() {
        return contractReviewDate;
    }

    public void setContractReviewDate(LocalDate contractReviewDate) {
        this.contractReviewDate = contractReviewDate;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public Set<Asset> getAssets() {
        return assets;
    }

    public void setAssets(Set<Asset> assets) {
        this.assets = assets;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TicProvider that)) return false;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
