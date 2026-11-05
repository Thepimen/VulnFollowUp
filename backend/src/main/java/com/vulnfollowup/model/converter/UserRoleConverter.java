package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.UserRole;
import jakarta.persistence.Converter;

/**
 * Convertidor JPA para {@link UserRole}.
 *
 * <p>Traduce entre las constantes del enum y el texto exacto de la columna
 * {@code users.role} ({@code ADMIN}, {@code ANALYST} o {@code VIEWER}).</p>
 *
 * <p>Con {@code autoApply = true}, Hibernate lo aplica a todos los atributos de tipo
 * {@link UserRole} sin necesidad de anotar cada campo.</p>
 */
@Converter(autoApply = true)
public class UserRoleConverter extends DbValueEnumConverter<UserRole> {

    /** Crea el convertidor para el enum {@link UserRole}. */
    public UserRoleConverter() {
        super(UserRole.class);
    }
}
