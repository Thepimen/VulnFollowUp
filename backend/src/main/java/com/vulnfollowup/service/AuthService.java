package com.vulnfollowup.service;

import java.util.Arrays;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vulnfollowup.dto.AuthResponse;
import com.vulnfollowup.model.User;
import com.vulnfollowup.model.enums.UserRole;
import com.vulnfollowup.repository.UserRepository;

/**
 * Servicio de autenticación y control de acceso basado en roles (RBAC: ADMIN, ANALYST, VIEWER).
 * Gestiona el registro con hash BCrypt (coste 12 + sal aleatoria) y la verificación en el login.
 */
@Service
@Transactional
public class AuthService {

    /** Mensaje genérico de login fallido: no revela si falla el usuario, la contraseña o el estado activo. */
    public static final String INVALID_CREDENTIALS = "Credenciales inválidas";

    // Longitudes máximas de las columnas de la tabla users del Esquema_Oficial
    static final int MAX_USERNAME_LENGTH = 50;
    static final int MAX_EMAIL_LENGTH = 120;
    static final int MAX_FULL_NAME_LENGTH = 100;
    static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registra un nuevo usuario guardando su contraseña cifrada con BCrypt (nunca en texto plano).
     * Todas las validaciones se hacen antes del INSERT, así que un dato inválido no deja filas en users.
     *
     * @param role Valor_BD exacto del rol (ADMIN, ANALYST o VIEWER); se recibe como texto para
     *             poder rechazar valores no válidos con un Error_Validacion
     */
    public User registerUser(String username, String email, String fullName, String rawPassword, String role) {
        String cleanUsername = requireText("username", username, MAX_USERNAME_LENGTH);
        String cleanEmail = requireText("email", email, MAX_EMAIL_LENGTH);
        String cleanFullName = requireText("fullName", fullName, MAX_FULL_NAME_LENGTH);

        // La contraseña no se recorta: los espacios forman parte de ella
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("El campo password es obligatorio");
        }
        if (rawPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException(
                    "El campo password debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres");
        }

        UserRole parsedRole = parseRole(role);

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado: " + cleanUsername);
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("El email ya está registrado: " + cleanEmail);
        }

        // BCrypt coste 12 (SecurityCryptoConfig) con sal aleatoria embebida en el propio hash
        String hashedPassword = passwordEncoder.encode(rawPassword);
        User newUser = new User(cleanUsername, cleanEmail, cleanFullName, hashedPassword, parsedRole);
        newUser.setActive(true);
        return userRepository.save(newUser);
    }

    /**
     * Sobrecarga de conveniencia que recibe el rol ya tipado y delega en la versión de texto.
     */
    public User registerUser(String username, String email, String fullName, String rawPassword, UserRole role) {
        return registerUser(username, email, fullName, rawPassword, role == null ? null : role.getDbValue());
    }

    /**
     * Verifica las credenciales del usuario comparando la contraseña recibida contra el hash BCrypt
     * almacenado en la base de datos y devuelve su información y rol RBAC.
     * Usuario inexistente, contraseña incorrecta y usuario inactivo producen el mismo mensaje.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(String username, String rawPassword) {
        if (username == null || username.isBlank() || rawPassword == null) {
            throw new IllegalArgumentException(INVALID_CREDENTIALS);
        }

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new IllegalArgumentException(INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash()) || !user.isActive()) {
            throw new IllegalArgumentException(INVALID_CREDENTIALS);
        }

        return new AuthResponse(user.getId(), user.getUsername(), user.getRole(), true);
    }

    /**
     * Valida que el usuario tenga uno de los roles autorizados antes de ejecutar una operación protegida.
     */
    public void validateRole(User user, UserRole... allowedRoles) {
        if (user == null || user.getRole() == null) {
            throw new SecurityException("Acceso denegado: se requiere un usuario autenticado");
        }
        boolean authorized = Arrays.asList(allowedRoles).contains(user.getRole());
        if (!authorized) {
            throw new SecurityException(
                    "Acceso denegado: el rol " + user.getRole() + " no tiene permisos. Se requiere: " + Arrays.toString(allowedRoles)
            );
        }
    }

    // Comprueba que el campo no sea nulo ni esté en blanco y que, recortado, no supere la longitud de la columna
    private static String requireText(String field, String value, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("El campo " + field + " es obligatorio");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException("El campo " + field + " supera " + maxLength + " caracteres");
        }
        return trimmed;
    }

    // Traduce el texto del rol con comparación exacta (tras recortar espacios) contra los Valor_BD
    private static UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("El campo role es obligatorio");
        }
        try {
            return UserRole.fromDbValue(role.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Rol no válido: " + role.trim(), e);
        }
    }
}
