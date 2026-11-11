package com.vulnfollowup.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vulnfollowup.model.TicProvider;

/**
 * Repositorio JPA con las operaciones CRUD para la gestión de proveedores TIC (tabla tic_providers).
 */
@Repository
public interface TicProviderRepository extends JpaRepository<TicProvider, Integer> {
}
