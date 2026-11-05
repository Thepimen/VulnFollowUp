package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.CvssVersion;

import jakarta.persistence.Converter;

/**
 * Convertidor JPA para {@link CvssVersion}.
 *
 * <p>Traduce entre las constantes del enum y el texto exacto de la columna
 * {@code cvss_assessments.cvss_version}: {@code V3_1} se guarda como {@code "3.1"}
 * y {@code V4_0} como {@code "4.0"}.</p>
 *
 * <p>Con {@code autoApply = true}, Hibernate lo aplica a todos los atributos de tipo
 * {@link CvssVersion} sin necesidad de anotar cada campo.</p>
 */
@Converter(autoApply = true)
public class CvssVersionConverter extends DbValueEnumConverter<CvssVersion> {

    /** Crea el convertidor para el enum {@link CvssVersion}. */
    public CvssVersionConverter() {
        super(CvssVersion.class);
    }
}
