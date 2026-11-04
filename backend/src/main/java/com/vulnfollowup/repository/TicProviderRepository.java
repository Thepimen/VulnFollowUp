package com.vulnfollowup.repository;

import com.vulnfollowup.model.TicProvider;
import com.vulnfollowup.model.enums.ProviderCriticality;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA con las operaciones CRUD para la gestión de proveedores TIC (DORA / SGE).
 */
@Repository
public interface TicProviderRepository extends JpaRepository<TicProvider, Long> {

    // Busca un proveedor por su nombre
    Optional<TicProvider> findByName(String name);

    // Filtra proveedores según su nivel de criticidad (LOW, MEDIUM, HIGH, CRITICAL)
    List<TicProvider> findByCriticality(ProviderCriticality criticality);
}
