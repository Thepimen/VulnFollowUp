package com.vulnfollowup.model.converter;

import com.vulnfollowup.model.enums.DbValueEnum;
import jakarta.persistence.AttributeConverter;

/**
 * Convertidor JPA genérico para cualquier enum que implemente {@link DbValueEnum}.
 *
 * <p>JPA llama a este convertidor automáticamente al guardar y al leer una entidad:</p>
 * <ul>
 *   <li>Al guardar: enum Java → texto de la BD, con {@link DbValueEnum#getDbValue()}.</li>
 *   <li>Al leer: texto de la BD → enum Java, con {@link DbValueEnum#fromDbValue(Class, String)}.</li>
 * </ul>
 *
 * <p>Es abstracta porque JPA necesita una clase concreta por cada enum. Cada convertidor
 * concreto solo tiene que pasar la clase de su enum al constructor, por ejemplo:</p>
 *
 * <pre>{@code
 * @Converter(autoApply = true)
 * public class CvssSeverityConverter extends DbValueEnumConverter<CvssSeverity> {
 *     public CvssSeverityConverter() {
 *         super(CvssSeverity.class);
 *     }
 * }
 * }</pre>
 *
 * @param <E> tipo del enum que se convierte
 */
public abstract class DbValueEnumConverter<E extends Enum<E> & DbValueEnum>
        implements AttributeConverter<E, String> {

    /** Clase del enum; hace falta para recorrer sus constantes al leer de la BD. */
    private final Class<E> type;

    /**
     * @param type clase del enum que convierte la subclase, por ejemplo {@code UserRole.class}
     */
    protected DbValueEnumConverter(Class<E> type) {
        this.type = type;
    }

    /**
     * Convierte el enum en el texto que se guarda en la columna.
     *
     * @param attribute valor del enum en la entidad; puede ser {@code null}
     * @return valor de BD exacto, o {@code null} si el atributo es {@code null}
     */
    @Override
    public String convertToDatabaseColumn(E attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    /**
     * Convierte el texto leído de la columna en la constante del enum.
     *
     * @param dbData texto almacenado en la base de datos; puede ser {@code null}
     * @return la constante correspondiente, o {@code null} si {@code dbData} es {@code null}
     * @throws IllegalArgumentException si el texto no coincide exactamente con ningún valor de BD
     */
    @Override
    public E convertToEntityAttribute(String dbData) {
        return DbValueEnum.fromDbValue(type, dbData);
    }
}
