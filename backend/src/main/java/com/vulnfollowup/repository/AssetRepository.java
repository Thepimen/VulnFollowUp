package com.vulnfollowup.repository;

import com.vulnfollowup.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio JPA con las operaciones CRUD básicas para gestionar los activos (Asset).
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    // Devuelve todos los activos que dependen de un proveedor TIC concreto
    List<Asset> findByTicProviderId(Long ticProviderId);

    // Filtra los activos por entorno (ej: PRODUCTION, STAGING...)
    List<Asset> findByEnvironment(String environment);
}
