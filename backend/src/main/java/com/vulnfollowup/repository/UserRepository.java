package com.vulnfollowup.repository;

import com.vulnfollowup.model.User;
import com.vulnfollowup.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para gestionar las operaciones de acceso a datos de los usuarios.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Busca un usuario por su nombre de usuario único para el proceso de login
    Optional<User> findByUsername(String username);

    // Comprueba si ya existe un nombre de usuario antes de registrar uno nuevo
    boolean existsByUsername(String username);

    // Filtra usuarios según su rol en el sistema (ADMIN, ANALYST, VIEWER)
    List<User> findByRole(UserRole role);
}
