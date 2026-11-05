package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.CvssSeverity;

import jakarta.persistence.Converter;

/**
 * Convertidor JPA para {@link CvssSeverity}.
 *
 * <p>Traduce entre las constantes del enum y el texto exacto de la columna
 * {@code cvss_assessments.severity} ({@code NONE}, {@code LOW}, {@code MEDIUM},
 * {@code HIGH} o {@code CRITICAL}).</p>
 *
 * <p>Con {@code autoApply = true}, Hibernate lo aplica a todos los atributos de tipo
 * {@link CvssSeverity} sin necesidad de anotar cada campo.</p>
 */
@Converter(autoApply = true)
public class CvssSeverityConverter extends DbValueEnumConverter<CvssSeverity> {

    /** Crea el convertidor para el enum {@link CvssSeverity}. */
    public CvssSeverityConverter() {
        super(CvssSeverity.class);
    }
}
