package com.vulnfollowup.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Entidad que representa cada activo de la empresa (servidores, APIs, bases de datos, etc.).
 * Se conecta con la tabla "Asset" de nuestra base de datos.
 */
@Entity
@Table(name = "\"Asset\"")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "type", length = 50, nullable = false)
    private String type;

    @Column(name = "owner", length = 100, nullable = false)
    private String owner;

    @Column(name = "environment", length = 50, nullable = false)
    private String environment;

    @Column(name = "status", length = 50, nullable = false)
    private String status;

    // Muchos activos pueden depender de un mismo proveedor TIC (clave foránea id_provider en SQL)
    // Se pone en LAZY para evitar consultas innecesarias (problema N+1)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_provider", foreignKey = @ForeignKey(name = "fk_provider"))
    private TicProvider ticProvider;

    // Lado inverso de la relación N:M con Vulnerability (el lado propietario está en Vulnerability)
    @ManyToMany(mappedBy = "assets", fetch = FetchType.LAZY)
    private Set<Vulnerability> vulnerabilities = new LinkedHashSet<>();

    public Asset() {
    }

    public Asset(
            String name,
            String type,
            String owner,
            String environment,
            String status,
            TicProvider ticProvider
    ) {
        this.name = name;
        this.type = type;
        this.owner = owner;
        this.environment = environment;
        this.status = status;
        this.ticProvider = ticProvider;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public TicProvider getTicProvider() {
        return ticProvider;
    }

    public void setTicProvider(TicProvider ticProvider) {
        this.ticProvider = ticProvider;
    }

    public Set<Vulnerability> getVulnerabilities() {
        return vulnerabilities;
    }

    public void setVulnerabilities(Set<Vulnerability> vulnerabilities) {
        this.vulnerabilities = vulnerabilities;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Asset asset)) return false;
        return id != null && Objects.equals(id, asset.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
