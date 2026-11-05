package com.vulnfollowup.model.enums;

/**
 * Interfaz común para los enums que se guardan en la base de datos como texto.
 *
 * <p>Cada constante del enum tiene un "valor de BD" ({@link #getDbValue()}), que es el
 * texto exacto que admite la restricción CHECK de su columna en PostgreSQL. Por ejemplo,
 * {@code PENDIENTE_DE_REMEDIACION} se guarda como {@code "PENDIENTE DE REMEDIACIÓN"}.</p>
 *
 * <p>Así todos los enums se traducen de la misma forma y en un único sitio:
 * el método estático {@link #fromDbValue(Class, String)}.</p>
 */
public interface DbValueEnum {

    /**
     * Devuelve el texto que se guarda en la base de datos para esta constante.
     *
     * @return valor de BD exacto (respetando mayúsculas, tildes y espacios)
     */
    String getDbValue();

    /**
     * Busca la constante del enum cuyo valor de BD es exactamente {@code value}.
     *
     * <p>La comparación es estricta, carácter a carácter, con {@link String#equals(Object)}:
     * no se ignoran mayúsculas, tildes ni espacios. Por eso {@code "critical"} o
     * {@code "PENDIENTE DE REMEDIACION"} (sin tilde) se rechazan.</p>
     *
     * <p>El tipo genérico {@code E extends Enum<E> & DbValueEnum} significa que
     * {@code E} tiene que ser un enum <b>y</b> además implementar esta interfaz.</p>
     *
     * @param type  clase del enum en el que buscar, por ejemplo {@code CvssSeverity.class}
     * @param value texto leído de la base de datos o del JSON; puede ser {@code null}
     * @param <E>   tipo del enum
     * @return la constante encontrada, o {@code null} si {@code value} es {@code null}
     * @throws IllegalArgumentException si ningún valor de BD coincide exactamente con {@code value};
     *                                  el mensaje incluye el nombre del enum y el texto recibido
     */
    static <E extends Enum<E> & DbValueEnum> E fromDbValue(Class<E> type, String value) {
        // Un valor nulo en la columna se traduce a un atributo nulo en Java
        if (value == null) {
            return null;
        }
        // Recorremos todas las constantes del enum buscando una coincidencia exacta
        for (E constant : type.getEnumConstants()) {
            if (constant.getDbValue().equals(value)) {
                return constant;
            }
        }
        // Si llegamos aquí, el texto no corresponde a ninguna constante
        throw new IllegalArgumentException(
                "Valor no válido para " + type.getSimpleName() + ": '" + value + "'");
    }
}
