package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.ProviderCriticality;
import jakarta.persistence.Converter;

/**
 * Convertidor JPA para {@link ProviderCriticality}.
 *
 * <p>Traduce entre las constantes del enum y el texto exacto de las columnas
 * {@code ict_providers.criticality} y {@code assets.criticality} ({@code LOW},
 * {@code MEDIUM}, {@code HIGH} o {@code CRITICAL}).</p>
 *
 * <p>Con {@code autoApply = true}, Hibernate lo aplica a todos los atributos de tipo
 * {@link ProviderCriticality} sin necesidad de anotar cada campo.</p>
 */
@Converter(autoApply = true)
public class ProviderCriticalityConverter extends DbValueEnumConverter<ProviderCriticality> {

    /** Crea el convertidor para el enum {@link ProviderCriticality}. */
    public ProviderCriticalityConverter() {
        super(ProviderCriticality.class);
    }
}
