package com.vulnfollowup.dto;

import com.vulnfollowup.model.enums.UserRole;

import java.util.Arrays;

/**
 * DTO de respuesta tras un login correcto con los datos de sesión y el rol RBAC del usuario.
 */
public class AuthResponse {

    private Long userId;
    private String username;
    private UserRole role;
    private boolean authenticated;

    public AuthResponse() {
    }

    public AuthResponse(Long userId, String username, UserRole role, boolean authenticated) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.authenticated = authenticated;
    }

    // Comprueba si el usuario autenticado posee alguno de los roles requeridos
    public boolean hasAnyRole(UserRole... allowedRoles) {
        if (role == null || allowedRoles == null) {
            return false;
        }
        return Arrays.asList(allowedRoles).contains(role);
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }
}
