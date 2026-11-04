package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.CvssVersion;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Convertidor para guardar la versión de CVSS como texto ("3.1" o "4.0") en la BD
 * mientras en Java trabajamos de forma segura con el enum CvssVersion.
 */
@Converter(autoApply = true)
public class CvssVersionConverter implements AttributeConverter<CvssVersion, String> {

    @Override
    public String convertToDatabaseColumn(CvssVersion attribute) {
        return attribute != null ? attribute.getDbValue() : null;
    }

    @Override
    public CvssVersion convertToEntityAttribute(String dbData) {
        return CvssVersion.fromDbValue(dbData);
    }
}
