package com.vulnfollowup.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuración criptográfica para la gestión segura de contraseñas.
 * Emplea BCrypt con un factor de coste de 12 (generando un salt aleatorio único por usuario),
 * cumpliendo la prohibición de guardar contraseñas en texto plano.
 */
@Configuration
public class SecurityCryptoConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
