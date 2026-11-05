package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.ExposureStatus;
import jakarta.persistence.Converter;

/**
 * Convertidor JPA para {@link ExposureStatus}.
 *
 * <p>Traduce entre las constantes del enum y el texto exacto de la columna
 * {@code vulnerability_assets.exposure_status} ({@code AFFECTED}, {@code MITIGATED},
 * {@code PATCHED} o {@code RISK_ACCEPTED}).</p>
 *
 * <p>Con {@code autoApply = true}, Hibernate lo aplica a todos los atributos de tipo
 * {@link ExposureStatus} sin necesidad de anotar cada campo.</p>
 */
@Converter(autoApply = true)
public class ExposureStatusConverter extends DbValueEnumConverter<ExposureStatus> {

    /** Crea el convertidor para el enum {@link ExposureStatus}. */
    public ExposureStatusConverter() {
        super(ExposureStatus.class);
    }
}
