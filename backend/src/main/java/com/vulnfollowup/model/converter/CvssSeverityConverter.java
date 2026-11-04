package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.CvssSeverity;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Convertidor de JPA que transforma la severidad de Java (NINGUNA, BAJA, MEDIA, ALTA, CRITICA)
 * al formato que tiene la tabla CVSS_Assessment en la base de datos (None, Low, Medium, High, Critical).
 */
@Converter(autoApply = true)
public class CvssSeverityConverter implements AttributeConverter<CvssSeverity, String> {

    @Override
    public String convertToDatabaseColumn(CvssSeverity attribute) {
        return attribute != null ? attribute.getDbValue() : null;
    }

    @Override
    public CvssSeverity convertToEntityAttribute(String dbData) {
        return CvssSeverity.fromDbValue(dbData);
    }
}
