package com.vulnfollowup.model;

import java.time.OffsetDateTime;
import java.util.Objects;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.vulnfollowup.model.enums.ProviderCriticality;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entidad que representa cada activo tecnológico (servidores, APIs, bases de datos, etc.).
 * Se mapea contra la tabla {@code assets} del Esquema_Oficial (13 columnas).
 * La relación con vulnerabilidades se navega desde Vulnerability a través de VulnerabilityAsset.
 */
@Entity
@Table(name = "assets")
public class Asset {

    // La PK es SERIAL (INTEGER) en PostgreSQL, por eso el id es Integer
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id;

    @Column(name = "asset_code", length = 40, nullable = false, unique = true)
    private String assetCode;

    @Column(name = "name", length = 120, nullable = false, unique = true)
    private String name;

    // Texto libre vigilado por la CHECK del esquema (API_SERVICE, DATABASE, WEB_SERVER...)
    @Column(name = "asset_type", length = 50, nullable = false)
    private String assetType;

    // Mismos valores que la criticidad del proveedor; ProviderCriticalityConverter (autoApply)
    @Column(name = "criticality", length = 20, nullable = false)
    private ProviderCriticality criticality;

    // PRODUCTION, STAGING, DEVELOPMENT o DR
    @Column(name = "environment", length = 30, nullable = false)
    private String environment = "PRODUCTION";

    @Column(name = "owner_department", length = 100, nullable = false)
    private String ownerDepartment;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "operating_system", length = 80)
    private String operatingSystem;

    // ACTIVE, MAINTENANCE o DECOMMISSIONED
    @Column(name = "status", length = 30, nullable = false)
    private String status = "ACTIVE";

    // Muchos activos pueden depender de un mismo proveedor TIC; provider_id admite NULL.
    // LAZY para evitar consultas innecesarias (problema N+1)
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "provider_id")
    private TicProvider provider;

    // Hibernate inserta la columna explícitamente, así que el DEFAULT de la BD no se aplicaría
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Asset() {
    }

    public Asset(
            String assetCode,
            String name,
            String assetType,
            ProviderCriticality criticality,
            String ownerDepartment,
            TicProvider provider
    ) {
        this.assetCode = assetCode;
        this.name = name;
        this.assetType = assetType;
        this.criticality = criticality;
        this.ownerDepartment = ownerDepartment;
        this.provider = provider;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAssetType() {
        return assetType;
    }

    public void setAssetType(String assetType) {
        this.assetType = assetType;
    }

    public ProviderCriticality getCriticality() {
        return criticality;
    }

    public void setCriticality(ProviderCriticality criticality) {
        this.criticality = criticality;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getOwnerDepartment() {
        return ownerDepartment;
    }

    public void setOwnerDepartment(String ownerDepartment) {
        this.ownerDepartment = ownerDepartment;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getOperatingSystem() {
        return operatingSystem;
    }

    public void setOperatingSystem(String operatingSystem) {
        this.operatingSystem = operatingSystem;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public TicProvider getProvider() {
        return provider;
    }

    public void setProvider(TicProvider provider) {
        this.provider = provider;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Igualdad por id: dos instancias sin persistir nunca son iguales
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Asset asset)) return false;
        return id != null && Objects.equals(id, asset.id);
    }

    // hashCode constante por clase para que no cambie al asignarse el id tras el INSERT
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
