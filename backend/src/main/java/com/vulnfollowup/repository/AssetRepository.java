package com.vulnfollowup.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vulnfollowup.model.Asset;

/**
 * Repositorio JPA con las operaciones CRUD básicas para gestionar los activos (tabla assets).
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, Integer> {

    // Cuenta los activos que dependen de un proveedor TIC concreto (resuelve provider.id)
    long countByProviderId(Integer providerId);

    // Filtra los activos por entorno (ej: PRODUCTION, STAGING...)
    List<Asset> findByEnvironment(String environment);
}
