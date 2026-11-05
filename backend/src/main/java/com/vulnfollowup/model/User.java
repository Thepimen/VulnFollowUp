package com.vulnfollowup.model;

import java.time.OffsetDateTime;
import java.util.Objects;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.vulnfollowup.model.enums.UserRole;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entidad que representa a los usuarios de la plataforma (tabla {@code users} del Esquema_Oficial).
 * Almacena el hash BCrypt de la contraseña (coste 12, con la sal embebida en el propio hash)
 * y su rol de control de acceso (ADMIN, ANALYST o VIEWER).
 */
@Entity
@Table(name = "users")
public class User {

    // La PK es SERIAL (INTEGER) en PostgreSQL, por eso el id es Integer
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Integer id;

    @Column(name = "username", length = 50, nullable = false, unique = true)
    private String username;

    @Column(name = "email", length = 120, nullable = false, unique = true)
    private String email;

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    // Nunca se guarda la contraseña en texto plano; solo el hash BCrypt con sal integrada ($2a$12$...)
    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    // Se traduce con UserRoleConverter (autoApply), que escribe el Valor_BD exacto
    @Column(name = "role", length = 20, nullable = false)
    private UserRole role;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // Hibernate inserta la columna explícitamente, así que el DEFAULT de la BD no se aplicaría
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public User() {
    }

    public User(String username, String email, String fullName, String passwordHash, UserRole role) {
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
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
        if (!(o instanceof User user)) return false;
        return id != null && Objects.equals(id, user.id);
    }

    // hashCode constante por clase para que no cambie al asignarse el id tras el INSERT
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
