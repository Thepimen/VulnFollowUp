package com.vulnfollowup;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal de arranque del backend de VulnFollowUp.
 * Desde aquí se inicia el contexto de Spring Boot, la conexión a la base de datos
 * y la validación de las entidades JPA con Hibernate.
 */
@SpringBootApplication
public class VulnFollowUpApplication {

    public static void main(String[] args) {
        SpringApplication.run(VulnFollowUpApplication.class, args);
    }
}
