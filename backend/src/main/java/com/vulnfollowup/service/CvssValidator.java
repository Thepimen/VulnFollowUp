package com.vulnfollowup.service;

import com.vulnfollowup.model.enums.CvssSeverity;
import com.vulnfollowup.model.enums.CvssVersion;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Validador_CVSS: comprueba que una evaluación CVSS es coherente con las mismas reglas
 * que aplican las restricciones CHECK del esquema oficial.
 *
 * <p>Es una clase de lógica pura, sin estado y sin dependencias de Spring ni de la base
 * de datos, de modo que se puede probar de forma aislada. {@code VulnerabilityService}
 * delega en ella antes de cualquier INSERT.</p>
 *
 * <p>Todas las comprobaciones lanzan {@link IllegalArgumentException} con un mensaje en
 * español. Cuando una evaluación incumple varias reglas, solo se informa de la primera
 * según este orden (criterio 11.9):</p>
 * <ol>
 *   <li>Campos obligatorios: versión, vector (no nulo ni en blanco), nota y severidad.</li>
 *   <li>Prefijo del vector {@code CVSS:<versión>/}, sensible a mayúsculas y sin {@code trim}.</li>
 *   <li>Nota entre 0.0 y 10.0 (ambos incluidos) tras normalizarla.</li>
 *   <li>Severidad declarada igual a la esperada para la nota.</li>
 * </ol>
 */
public final class CvssValidator {

    /** Escala de la columna {@code cvss_score NUMERIC(3,1)}: una única cifra decimal. */
    private static final int SCORE_SCALE = 1;

    private static final BigDecimal MIN_SCORE = new BigDecimal("0.0");
    private static final BigDecimal MAX_SCORE = new BigDecimal("10.0");

    // Límites superiores (incluidos) de cada tramo de la escala oficial (criterio 11.5)
    private static final BigDecimal NONE_MAX = new BigDecimal("0.0");
    private static final BigDecimal LOW_MAX = new BigDecimal("3.9");
    private static final BigDecimal MEDIUM_MAX = new BigDecimal("6.9");
    private static final BigDecimal HIGH_MAX = new BigDecimal("8.9");

    /** Clase de utilidades: no se instancia. */
    private CvssValidator() {
    }

    /**
     * Normaliza la nota a una cifra decimal con redondeo {@link RoundingMode#HALF_UP},
     * igual que hace PostgreSQL al guardar en una columna {@code NUMERIC(3,1)}.
     *
     * <p>Por ejemplo, 3.95 pasa a 4.0 y 9.84 pasa a 9.8. La nota normalizada es la que
     * se valida y la que se persiste.</p>
     *
     * @param score nota recibida
     * @return la nota con escala 1
     * @throws IllegalArgumentException si {@code score} es {@code null}
     */
    public static BigDecimal normalizeScore(BigDecimal score) {
        if (score == null) {
            throw requiredField("cvss_score");
        }
        return score.setScale(SCORE_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Calcula la severidad que corresponde a una nota según la escala oficial, con ambos
     * extremos de cada tramo incluidos: 0.0 → {@code NONE}; 0.1 a 3.9 → {@code LOW};
     * 4.0 a 6.9 → {@code MEDIUM}; 7.0 a 8.9 → {@code HIGH}; 9.0 a 10.0 → {@code CRITICAL}.
     *
     * <p>La nota se normaliza primero, así que no existen valores entre 0.0 y 0.1 ni
     * huecos entre tramos. Las comparaciones usan {@link BigDecimal#compareTo(BigDecimal)}
     * para no depender de la escala ({@code equals} distingue 4.0 de 4.00).</p>
     *
     * @param score nota a clasificar
     * @return severidad esperada
     * @throws IllegalArgumentException si la nota es {@code null} o queda fuera del rango 0.0 a 10.0
     */
    public static CvssSeverity expectedSeverity(BigDecimal score) {
        BigDecimal normalized = normalizeScore(score);
        checkRange(score, normalized);

        if (normalized.compareTo(NONE_MAX) <= 0) {
            return CvssSeverity.NONE;
        }
        if (normalized.compareTo(LOW_MAX) <= 0) {
            return CvssSeverity.LOW;
        }
        if (normalized.compareTo(MEDIUM_MAX) <= 0) {
            return CvssSeverity.MEDIUM;
        }
        if (normalized.compareTo(HIGH_MAX) <= 0) {
            return CvssSeverity.HIGH;
        }
        return CvssSeverity.CRITICAL;
    }

    /**
     * Valida una evaluación CVSS completa aplicando las reglas en el orden del criterio 11.9.
     * Si la evaluación es coherente, el método termina sin lanzar ninguna excepción.
     *
     * @param version  versión CVSS declarada
     * @param vector   vector CVSS, que debe empezar por {@code CVSS:<versión>/}
     * @param score    nota CVSS (se normaliza a una cifra decimal antes de comprobarla)
     * @param severity severidad declarada
     * @throws IllegalArgumentException con la primera regla incumplida
     */
    public static void validate(CvssVersion version, String vector, BigDecimal score, CvssSeverity severity) {
        // 1. Campos obligatorios (criterio 11.8)
        if (version == null) {
            throw requiredField("cvss_version");
        }
        if (vector == null || vector.isBlank()) {
            throw requiredField("cvss_vector");
        }
        if (score == null) {
            throw requiredField("cvss_score");
        }
        if (severity == null) {
            throw requiredField("severity");
        }

        // 2. Prefijo del vector, sensible a mayúsculas y sin trim (criterios 11.1 y 11.2)
        String declaredVersion = version.getDbValue();
        String expectedPrefix = "CVSS:" + declaredVersion + "/";
        if (!vector.startsWith(expectedPrefix)) {
            throw new IllegalArgumentException(
                    "Incoherencia CVSS: la versión declarada es " + declaredVersion
                            + " pero el vector no empieza por '" + expectedPrefix
                            + "' (recibido: " + vector + ")");
        }

        // 3. Rango de la nota tras normalizar (criterio 11.3)
        BigDecimal normalized = normalizeScore(score);
        checkRange(score, normalized);

        // 4. Coherencia nota/severidad (criterios 11.4 y 11.5)
        CvssSeverity expected = expectedSeverity(normalized);
        if (severity != expected) {
            throw new IllegalArgumentException(
                    "Incoherencia CVSS: una nota de " + normalized.toPlainString()
                            + " corresponde a severidad " + expected.getDbValue()
                            + ", pero se declaró " + severity.getDbValue());
        }
    }

    /**
     * Comprueba que la nota normalizada está entre 0.0 y 10.0, ambos incluidos.
     *
     * @param original   nota tal como se recibió, para mostrarla en el mensaje
     * @param normalized nota con escala 1
     * @throws IllegalArgumentException si la nota queda fuera del rango
     */
    private static void checkRange(BigDecimal original, BigDecimal normalized) {
        if (normalized.compareTo(MIN_SCORE) < 0 || normalized.compareTo(MAX_SCORE) > 0) {
            throw new IllegalArgumentException(
                    "Puntuación CVSS fuera del rango 0.0 a 10.0: " + original.toPlainString());
        }
    }

    /**
     * Construye el error de campo obligatorio ausente.
     *
     * @param field nombre de la columna afectada
     * @return excepción con el mensaje {@code "El campo <campo> de la evaluación CVSS es obligatorio"}
     */
    private static IllegalArgumentException requiredField(String field) {
        return new IllegalArgumentException(
                "El campo " + field + " de la evaluación CVSS es obligatorio");
    }
}
