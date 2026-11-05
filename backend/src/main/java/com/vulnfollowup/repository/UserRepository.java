package com.vulnfollowup.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vulnfollowup.model.User;

/**
 * Repositorio JPA para gestionar las operaciones de acceso a datos de los usuarios (tabla users).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Busca un usuario por su nombre de usuario único para el proceso de login
    Optional<User> findByUsername(String username);

    // Comprueba si ya existe un nombre de usuario antes de registrar uno nuevo
    boolean existsByUsername(String username);

    // Comprueba si ya existe un email antes de registrar un usuario nuevo
    boolean existsByEmail(String email);
}
