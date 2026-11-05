package com.vulnfollowup.service;

import com.vulnfollowup.dto.AuthResponse;
import com.vulnfollowup.model.User;
import com.vulnfollowup.model.enums.UserRole;
import com.vulnfollowup.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

/**
 * Servicio de autenticación y control de acceso basado en roles (RBAC: ADMIN, ANALYST, VIEWER).
 * Gestiona el registro con hash BCrypt (coste 12 + sal aleatoria) y la verificación en el login.
 */
@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registra un nuevo usuario guardando su contraseña cifrada con BCrypt (nunca en texto plano).
     */
    public User registerUser(String username, String rawPassword, UserRole role) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("El nombre de usuario no puede estar vacío");
        }
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres");
        }
        if (role == null) {
            throw new IllegalArgumentException("El rol del usuario es obligatorio (ADMIN, ANALYST o VIEWER)");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException("Ya existe un usuario registrado con el nombre: " + username);
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);
        User newUser = new User(username.trim(), hashedPassword, role);
        return userRepository.save(newUser);
    }

    /**
     * Verifica las credenciales del usuario comparando la contraseña recibida contra el hash BCrypt
     * almacenado en la base de datos y devuelve su información y rol RBAC.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(String username, String rawPassword) {
        if (username == null || rawPassword == null) {
            throw new IllegalArgumentException("Usuario y contraseña obligatorios");
        }

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas: usuario o contraseña incorrectos"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales inválidas: usuario o contraseña incorrectos");
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
}
