package com.vulnfollowup.support;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import org.junit.jupiter.api.Named;
import org.junit.jupiter.params.provider.Arguments;

/**
 * Generadores deterministas para las pruebas de propiedades (Properties 2, 10, 11, 16, 17 y 20 del diseño).
 *
 * <p>Reglas comunes:
 * <ul>
 *   <li>Todo sale de un {@link Random} con semilla fija ({@link #SEED}). Cada propiedad deriva su propia
 *       semilla a partir de la semilla base y del nombre de la propiedad, así que añadir casos a una
 *       propiedad no altera los de otra.</li>
 *   <li>Cada generador devuelve al menos {@link #MIN_CASES} casos (o el mínimo indicado) e incluye siempre
 *       los casos límite: cadena vacía, solo espacios, longitud máxima y máxima + 1, variantes sin tilde,
 *       en minúsculas o con un carácter cambiado.</li>
 *   <li>Los métodos {@code *Cases} devuelven {@code Stream<Arguments>} para {@code @MethodSource}. El primer
 *       argumento va envuelto en {@link Named}: su nombre contiene la propiedad, la semilla base y el índice
 *       del caso (desde 0), de modo que un fallo se reproduce con {@link #caseRandom(String, int)}.</li>
 * </ul>
 *
 * <p>No depende de clases del dominio: recibe textos, colecciones e ids como datos simples.
 *
 * <p>Ejemplo:
 * <pre>{@code
 * static Stream<Arguments> textosInvalidos() {
 *     return Generators.invalidEnumTextCases("P2-VulnerabilityStatus",
 *             List.of("ABIERTA", "PENDIENTE DE REMEDIACIÓN", "RESUELTA", "CERRADA"), 30);
 * }
 *
 * @ParameterizedTest(name = "{0}")
 * @MethodSource("textosInvalidos")
 * void rechazaTextosNoAdmitidos(String texto) { ... }
 * }</pre>
 */
public final class Generators {

    /** Semilla base por defecto. */
    public static final long DEFAULT_SEED = 20260515L;

    /** Propiedad de sistema para explorar otra semilla ({@code -Dvfu.generators.seed=...}); por defecto la fija. */
    public static final String SEED_PROPERTY = "vfu.generators.seed";

    /** Semilla base efectiva. Aparece en el nombre de cada caso. */
    public static final long SEED = Long.getLong(SEED_PROPERTY, DEFAULT_SEED);

    /** Número mínimo de casos por propiedad cuando el dominio no se enumera de forma exhaustiva. */
    public static final int MIN_CASES = 100;

    /** Patrón oficial de {@code internal_code} (criterio 10.5). */
    public static final Pattern INTERNAL_CODE_PATTERN = Pattern.compile("^VFU-[0-9]{4,}$");

    /** Patrón oficial de {@code cve_id} (criterio 10.6). */
    public static final Pattern CVE_ID_PATTERN = Pattern.compile("^CVE-[0-9]{4}-[0-9]{4,}$");

    /** Longitud máxima de {@code vulnerabilities.internal_code}. */
    public static final int INTERNAL_CODE_MAX_LENGTH = 20;

    /** Longitud máxima de {@code vulnerabilities.cve_id}. */
    public static final int CVE_ID_MAX_LENGTH = 30;

    // Alfabeto de sustitución: incluye tildes y espacio para que las mutaciones sean "parecidas" a los valores válidos.
    private static final String MUTATION_ALPHABET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-_ÁÉÍÓÚÑáéíóúñ";
    // Alfabeto para textos de relleno (sin espacios ni tildes: nunca en blanco y 1 carácter = 1 unidad UTF-16).
    private static final String PLAIN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final String EMAIL_DOMAIN = "@vfu.test";
    private static final int ATTEMPTS_PER_CASE = 200;
    private static final int NAME_PREVIEW_LENGTH = 40;

    private Generators() {
    }

    // =====================================================================================================
    // Semillas, nombres y Arguments
    // =====================================================================================================

    /** Variante generada: el texto y la descripción de cómo se obtuvo (aparece en el nombre del caso). */
    public record Variant(String text, String kind) {
        public String describe() {
            return visible(text) + " [" + kind + "]";
        }
    }

    /** Generador aleatorio de una propiedad: misma semilla base + mismo nombre = misma secuencia. */
    public static Random random(String property) {
        return new Random(propertySeed(property));
    }

    /** Generador aleatorio de un caso concreto, para reproducir el caso {@code index} de {@code property}. */
    public static Random caseRandom(String property, int index) {
        return new Random(caseSeed(property, index));
    }

    /** Semilla de un caso concreto: depende solo de la semilla base, la propiedad y el índice. */
    public static long caseSeed(String property, int index) {
        return mix64(propertySeed(property) + 0x9E3779B97F4A7C15L * (index + 1L));
    }

    /** Nombre de un caso parametrizado: propiedad, semilla base, índice y descripción. */
    public static String caseName(String property, int index, String description) {
        return property + " seed=" + SEED + " caso=" + index + ": " + description;
    }

    /**
     * Convierte una lista de valores en argumentos parametrizados. El primer argumento es el valor envuelto
     * en {@link Named} con el nombre de {@link #caseName}; detrás van {@code fixedArgs} sin cambios
     * (por ejemplo, el convertidor que se está probando).
     */
    public static <T> Stream<Arguments> cases(String property, List<? extends T> values,
                                              Function<? super T, String> describe, Object... fixedArgs) {
        Objects.requireNonNull(property, "property");
        return IntStream.range(0, values.size()).mapToObj(i -> {
            T value = values.get(i);
            Object[] args = new Object[1 + fixedArgs.length];
            args[0] = Named.of(caseName(property, i, describe.apply(value)), value);
            System.arraycopy(fixedArgs, 0, args, 1, fixedArgs.length);
            return Arguments.of(args);
        });
    }

    /** Casos de solo semilla: cada caso recibe un {@link Random} propio, reproducible con {@link #caseRandom}. */
    public static Stream<Arguments> seededCases(String property, int minCases) {
        return IntStream.range(0, Math.max(minCases, MIN_CASES)).mapToObj(i -> Arguments.of(
                Named.of(caseName(property, i, "caseSeed=" + caseSeed(property, i)), caseRandom(property, i))));
    }

    /** Texto legible para nombres de caso: hace visibles espacios especiales, controles y marcas combinantes. */
    public static String visible(String text) {
        if (text == null) {
            return "null";
        }
        StringBuilder sb = new StringBuilder("«");
        int shown = Math.min(text.length(), NAME_PREVIEW_LENGTH);
        for (int i = 0; i < shown; i++) {
            char c = text.charAt(i);
            switch (c) {
                case '\t' -> sb.append("\\t");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                default -> {
                    int type = Character.getType(c);
                    boolean invisible = c < 0x20
                            || type == Character.NON_SPACING_MARK
                            || (type == Character.SPACE_SEPARATOR && c != ' ');
                    if (invisible) {
                        sb.append(String.format("\\u%04X", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        if (text.length() > shown) {
            sb.append('…');
        }
        sb.append('»');
        if (text.length() > shown || text.isBlank()) {
            sb.append(" (len=").append(text.length()).append(')');
        }
        return sb.toString();
    }

    // =====================================================================================================
    // Property 2: textos de enum no admitidos (criterios 5.9 y 3.10)
    // =====================================================================================================

    /**
     * Textos que no coinciden carácter a carácter con ningún Valor_BD de {@code validDbValues}.
     *
     * <p>Siempre incluye: cadena vacía, solo espacios (y tabuladores/saltos), longitud máxima y máxima + 1 de la
     * columna (si {@code columnMaxLength} no es nulo) y, para cada valor válido, sus variantes en minúsculas,
     * sin tilde, con la tilde en minúscula o descompuesta (NFD), con espacios extra, con cada carácter cambiado
     * o eliminado y, si es numérico (p. ej. {@code 3.1}), con un dígito cambiado ({@code 3.0}, {@code 4.1}...).
     * Se completa con mutaciones aleatorias hasta {@code minCases}. Nunca contiene {@code null}.
     */
    public static List<Variant> invalidEnumTexts(String property, Collection<String> validDbValues,
                                                 Integer columnMaxLength, int minCases) {
        Set<String> valid = Set.copyOf(validDbValues);
        if (valid.isEmpty()) {
            throw new IllegalArgumentException("Se necesita al menos un Valor_BD válido");
        }
        Random random = random(property);
        Map<String, String> out = new LinkedHashMap<>();
        addBlankEdgeCases(out, valid, false);
        List<String> samples = new ArrayList<>(new TreeSet<>(valid)); // orden estable
        if (columnMaxLength != null) {
            addLengthEdgeCases(out, valid, samples.get(0), columnMaxLength);
        }
        for (String v : samples) {
            addSystematicMutations(out, valid, v, random);
        }
        fillWithRandomMutations(out, samples, columnMaxLength, minCases, random,
                text -> text != null && !valid.contains(text));
        return toVariants(out);
    }

    /** Igual que {@link #invalidEnumTexts} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> invalidEnumTextCases(String property, Collection<String> validDbValues,
                                                         Integer columnMaxLength, Object... fixedArgs) {
        List<Variant> variants = invalidEnumTexts(property, validDbValues, columnMaxLength, MIN_CASES);
        return cases(property, texts(variants), indexDescriber(variants), fixedArgs);
    }

    // =====================================================================================================
    // Property 10: internal_code y cve_id fuera de formato (criterios 10.5 y 10.6)
    // =====================================================================================================

    /**
     * Textos que no cumplen {@code validPattern}, derivados de {@code validSamples} (que sí lo cumplen).
     * Incluye vacío, solo espacios, longitud máxima y máxima + 1 (rellenando con 'X', que rompe el patrón),
     * minúsculas, espacios extra y cada carácter cambiado o eliminado. {@code null} solo si {@code includeNull}.
     */
    public static List<Variant> invalidByPattern(String property, Pattern validPattern, List<String> validSamples,
                                                 Integer maxLength, boolean includeNull, int minCases) {
        for (String sample : validSamples) {
            if (!validPattern.matcher(sample).matches()) {
                throw new IllegalArgumentException("La muestra no cumple el patrón: " + sample);
            }
        }
        Random random = random(property);
        Predicate<String> invalid = text -> text != null && !validPattern.matcher(text).matches();
        Map<String, String> out = new LinkedHashMap<>();
        if (includeNull) {
            out.put(null, "nulo");
        }
        Set<String> none = Collections.emptySet();
        addBlankEdgeCases(out, none, false);
        if (maxLength != null) {
            addLengthEdgeCases(out, none, validSamples.get(0), maxLength);
        }
        for (String sample : validSamples) {
            Map<String, String> candidates = new LinkedHashMap<>();
            addSystematicMutations(candidates, none, sample, random);
            candidates.forEach((text, kind) -> {
                if (invalid.test(text)) {
                    out.putIfAbsent(text, kind);
                }
            });
        }
        // Red de seguridad: ningún caso límite puede cumplir el patrón.
        out.keySet().removeIf(text -> text != null && !invalid.test(text));
        fillWithRandomMutations(out, validSamples, maxLength, minCases, random, invalid);
        return toVariants(out);
    }

    /** {@code internal_code} inválidos (incluye {@code null}, {@code vfu-0001}, {@code VFU-001}, {@code VFU0001}...). */
    public static List<Variant> invalidInternalCodes(int minCases) {
        return invalidByPattern("P10-internal_code", INTERNAL_CODE_PATTERN,
                List.of("VFU-0001", "VFU-0012", "VFU-123456"), INTERNAL_CODE_MAX_LENGTH, true, minCases);
    }

    /** {@code cve_id} no nulos e inválidos ({@code null} es válido para esta columna). */
    public static List<Variant> invalidCveIds(int minCases) {
        return invalidByPattern("P10-cve_id", CVE_ID_PATTERN,
                List.of("CVE-2026-90001", "CVE-2031-1234", "CVE-2031-12345678"), CVE_ID_MAX_LENGTH, false, minCases);
    }

    /** {@link #invalidInternalCodes} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> invalidInternalCodeCases(Object... fixedArgs) {
        List<Variant> variants = invalidInternalCodes(MIN_CASES);
        return cases("P10-internal_code", texts(variants), indexDescriber(variants), fixedArgs);
    }

    /** {@link #invalidCveIds} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> invalidCveIdCases(Object... fixedArgs) {
        List<Variant> variants = invalidCveIds(MIN_CASES);
        return cases("P10-cve_id", texts(variants), indexDescriber(variants), fixedArgs);
    }

    /**
     * {@code n} códigos internos válidos y distintos que no chocan con el seed (VFU-0001 a VFU-0020 tienen
     * 4 dígitos; estos tienen 8) y caben en 20 caracteres.
     */
    public static List<String> validInternalCodes(Random random, int n) {
        Set<String> out = new LinkedHashSet<>();
        while (out.size() < n) {
            out.add("VFU-" + (10_000_000 + random.nextInt(90_000_000)));
        }
        return new ArrayList<>(out);
    }

    /** {@code n} CVE válidos y distintos de año 2031 (el seed usa 2026), de como mucho 30 caracteres. */
    public static List<String> validCveIds(Random random, int n) {
        Set<String> out = new LinkedHashSet<>();
        while (out.size() < n) {
            out.add("CVE-2031-" + (10_000_000 + random.nextInt(90_000_000)));
        }
        return new ArrayList<>(out);
    }

    // =====================================================================================================
    // Property 20: registro con exactamente un campo inválido (criterios 3.4 y 3.10)
    // =====================================================================================================

    /** Tipo de campo de una petición. */
    public enum FieldKind { TEXT, EMAIL, ONE_OF }

    /**
     * Descripción de un campo obligatorio: nombre, longitud máxima (nula = sin límite) y, para
     * {@link FieldKind#ONE_OF}, los valores admitidos.
     */
    public record FieldSpec(String name, Integer maxLength, FieldKind kind, List<String> allowedValues) {
        public static FieldSpec text(String name, Integer maxLength) {
            return new FieldSpec(name, maxLength, FieldKind.TEXT, List.of());
        }

        public static FieldSpec email(String name, Integer maxLength) {
            return new FieldSpec(name, maxLength, FieldKind.EMAIL, List.of());
        }

        public static FieldSpec oneOf(String name, Integer maxLength, List<String> allowedValues) {
            return new FieldSpec(name, maxLength, FieldKind.ONE_OF, List.copyOf(allowedValues));
        }
    }

    /**
     * Valores inválidos para un campo obligatorio de texto: nulo, vacío, solo espacios (espacio, tabulador,
     * salto de línea y mezclas) y, si hay longitud máxima, máxima + 1, máxima + 2, el doble y longitudes
     * aleatorias por encima del límite hasta {@code minCases}. Sin límite solo devuelve los casos en blanco.
     */
    public static List<Variant> invalidRequiredTexts(String property, Integer maxLength, boolean emailShaped,
                                                     int minCases) {
        Random random = random(property);
        Map<String, String> out = new LinkedHashMap<>();
        out.put(null, "nulo");
        addBlankEdgeCases(out, Collections.emptySet(), true);
        if (maxLength != null) {
            for (int extra : new int[] {1, 2, maxLength}) {
                int length = maxLength + extra;
                String kind = extra == 1 ? "longitud máxima + 1" : "longitud " + length + " > máxima " + maxLength;
                out.putIfAbsent(textForField(random, length, emailShaped), kind);
            }
            int attempts = 0;
            while (out.size() < minCases && attempts++ < minCases * ATTEMPTS_PER_CASE) {
                int length = maxLength + 1 + random.nextInt(2 * maxLength);
                out.putIfAbsent(textForField(random, length, emailShaped),
                        "longitud " + length + " > máxima " + maxLength);
            }
        }
        return toVariants(out);
    }

    /**
     * Casos con exactamente un campo inválido. Cada caso es {@code (Named<String> campo, String valorInválido)};
     * la prueba rellena el resto de campos con valores válidos (por ejemplo con {@link #validValue}).
     * Incluye para cada campo todos los casos en blanco y, según el tipo, longitud máxima + 1 o valores fuera
     * de {@code allowedValues} (variantes en minúsculas, sin tilde, con un carácter cambiado...). Se completa
     * por turnos entre los campos hasta {@code minCases}.
     */
    public static Stream<Arguments> singleInvalidFieldCases(String property, List<FieldSpec> fields, int minCases) {
        // Lista por campo, ya ordenada: primero los casos límite y después los aleatorios.
        List<List<Variant>> perField = new ArrayList<>();
        for (FieldSpec field : fields) {
            String fieldProperty = property + "-" + field.name();
            boolean oneOf = field.kind() == FieldKind.ONE_OF;
            // Casos en blanco y de longitud; para ONE_OF solo los deterministas, el resto sale de invalidEnumTexts.
            List<Variant> variants = new ArrayList<>(invalidRequiredTexts(fieldProperty, field.maxLength(),
                    field.kind() == FieldKind.EMAIL, oneOf ? 0 : minCases));
            if (oneOf) {
                Set<String> seen = new HashSet<>(texts(variants));
                for (Variant v : invalidEnumTexts(fieldProperty, field.allowedValues(), field.maxLength(), minCases)) {
                    if (seen.add(v.text())) {
                        variants.add(v);
                    }
                }
            }
            perField.add(variants);
        }

        // Primero los casos límite de cada campo (los no aleatorios), luego por turnos hasta minCases.
        List<String[]> selected = new ArrayList<>();
        List<String> kinds = new ArrayList<>();
        int[] next = new int[fields.size()];
        for (int f = 0; f < fields.size(); f++) {
            int edge = edgeCaseCount(fields.get(f));
            List<Variant> variants = perField.get(f);
            for (int i = 0; i < Math.min(edge, variants.size()); i++) {
                selected.add(new String[] {fields.get(f).name(), variants.get(i).text()});
                kinds.add(variants.get(i).kind());
            }
            next[f] = Math.min(edge, variants.size());
        }
        boolean progress = true;
        while (selected.size() < minCases && progress) {
            progress = false;
            for (int f = 0; f < fields.size() && selected.size() < minCases; f++) {
                List<Variant> variants = perField.get(f);
                if (next[f] < variants.size()) {
                    Variant v = variants.get(next[f]++);
                    selected.add(new String[] {fields.get(f).name(), v.text()});
                    kinds.add(v.kind());
                    progress = true;
                }
            }
        }
        if (selected.size() < minCases) {
            throw new IllegalStateException("Solo se pudieron generar " + selected.size() + " casos para " + property
                    + "; añade algún campo con longitud máxima o valores admitidos");
        }
        return IntStream.range(0, selected.size()).mapToObj(i -> {
            String field = selected.get(i)[0];
            String value = selected.get(i)[1];
            String name = caseName(property, i, field + " = " + visible(value) + " [" + kinds.get(i) + "]");
            return Arguments.of(Named.of(name, field), value);
        });
    }

    /** Valor válido para un campo: texto o email de hasta 24 caracteres (o la máxima) o un valor admitido. */
    public static String validValue(FieldSpec field, Random random) {
        int length = field.maxLength() == null ? 24 : Math.min(24, field.maxLength());
        return switch (field.kind()) {
            case TEXT -> textOfLength(random, length);
            case EMAIL -> emailOfLength(random, Math.max(length, EMAIL_DOMAIN.length() + 1));
            case ONE_OF -> pick(random, field.allowedValues());
        };
    }

    /** Texto alfanumérico en minúsculas de exactamente {@code length} caracteres (nunca en blanco si length > 0). */
    public static String textOfLength(Random random, int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PLAIN_ALPHABET.charAt(random.nextInt(PLAIN_ALPHABET.length())));
        }
        return sb.toString();
    }

    /** Email con forma válida ({@code xxx@vfu.test}) de exactamente {@code length} caracteres. */
    public static String emailOfLength(Random random, int length) {
        if (length <= EMAIL_DOMAIN.length()) {
            throw new IllegalArgumentException("Un email necesita más de " + EMAIL_DOMAIN.length() + " caracteres");
        }
        return textOfLength(random, length - EMAIL_DOMAIN.length()) + EMAIL_DOMAIN;
    }

    // =====================================================================================================
    // Properties 10 y 11: listas de ids de activo
    // =====================================================================================================

    /**
     * Listas de ids existentes con al menos una repetición (Property 11). Incluye siempre cada id repetido dos
     * veces, un id repetido tres veces y todos los ids dos veces; el resto son subconjuntos aleatorios con
     * repeticiones, barajados.
     */
    public static List<List<Integer>> listsWithRepeats(String property, List<Integer> existingIds, int minCases) {
        if (existingIds.isEmpty()) {
            throw new IllegalArgumentException("Se necesita al menos un id existente");
        }
        Random random = random(property);
        Set<List<Integer>> out = new LinkedHashSet<>();
        for (Integer id : existingIds) {
            out.add(List.of(id, id));
        }
        out.add(List.of(existingIds.get(0), existingIds.get(0), existingIds.get(0)));
        List<Integer> allTwice = new ArrayList<>(existingIds);
        allTwice.addAll(existingIds);
        out.add(List.copyOf(allTwice));
        int attempts = 0;
        while (out.size() < minCases && attempts++ < minCases * ATTEMPTS_PER_CASE) {
            List<Integer> base = randomNonEmptySubset(random, existingIds);
            List<Integer> list = new ArrayList<>(base);
            int repeats = 1 + random.nextInt(base.size() + 1);
            for (int i = 0; i < repeats; i++) {
                list.add(pick(random, base));
            }
            Collections.shuffle(list, random);
            out.add(List.copyOf(list));
        }
        return new ArrayList<>(out);
    }

    /** {@link #listsWithRepeats} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> listsWithRepeatsCases(String property, List<Integer> existingIds,
                                                          Object... fixedArgs) {
        return cases(property, listsWithRepeats(property, existingIds, MIN_CASES), Object::toString, fixedArgs);
    }

    /**
     * Listas que contienen al menos un id inexistente (Property 10, criterio 10.8). Incluye siempre cada id
     * inexistente candidato solo (0, -1, máximo + 1, {@code Integer.MAX_VALUE}...), un inexistente repetido,
     * dos inexistentes distintos y el inexistente al principio y al final de todos los existentes. La prueba
     * calcula los ids inexistentes esperados con {@link #missingIds}.
     */
    public static List<List<Integer>> listsWithMissingIds(String property, List<Integer> existingIds, int minCases) {
        if (existingIds.isEmpty()) {
            throw new IllegalArgumentException("Se necesita al menos un id existente");
        }
        Random random = random(property);
        Set<Integer> existing = new HashSet<>(existingIds);
        int max = Collections.max(existingIds);
        List<Integer> candidates = new ArrayList<>();
        for (int id : new int[] {0, -1, max + 1, max + 2, max + 1000, Integer.MAX_VALUE, Integer.MIN_VALUE}) {
            if (!existing.contains(id) && !candidates.contains(id)) {
                candidates.add(id);
            }
        }
        int firstMissing = max + 1;
        Set<List<Integer>> out = new LinkedHashSet<>();
        for (Integer id : candidates) {
            out.add(List.of(id));
        }
        out.add(List.of(firstMissing, firstMissing));
        out.add(List.of(firstMissing, max + 2));
        List<Integer> missingFirst = new ArrayList<>(List.of(firstMissing));
        missingFirst.addAll(existingIds);
        out.add(List.copyOf(missingFirst));
        List<Integer> missingLast = new ArrayList<>(existingIds);
        missingLast.add(firstMissing);
        out.add(List.copyOf(missingLast));
        int attempts = 0;
        while (out.size() < minCases && attempts++ < minCases * ATTEMPTS_PER_CASE) {
            List<Integer> list = new ArrayList<>(randomSubset(random, existingIds));
            int missingCount = 1 + random.nextInt(3);
            for (int i = 0; i < missingCount; i++) {
                list.add(random.nextBoolean() ? pick(random, candidates) : max + 1 + random.nextInt(1000));
            }
            Collections.shuffle(list, random);
            out.add(List.copyOf(list));
        }
        return new ArrayList<>(out);
    }

    /** {@link #listsWithMissingIds} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> listsWithMissingIdsCases(String property, List<Integer> existingIds,
                                                             Object... fixedArgs) {
        return cases(property, listsWithMissingIds(property, existingIds, MIN_CASES), Object::toString, fixedArgs);
    }

    /** Ids de {@code requested} que no están en {@code existingIds}, sin repetir y en orden de aparición. */
    public static List<Integer> missingIds(List<Integer> requested, Collection<Integer> existingIds) {
        Set<Integer> existing = new HashSet<>(existingIds);
        return requested.stream().filter(id -> !existing.contains(id)).distinct().toList();
    }

    /** Subconjunto aleatorio (puede ser vacío) que conserva el orden de {@code values}. */
    public static <T> List<T> randomSubset(Random random, List<T> values) {
        List<T> out = new ArrayList<>();
        for (T value : values) {
            if (random.nextBoolean()) {
                out.add(value);
            }
        }
        return out;
    }

    /** Subconjunto aleatorio no vacío que conserva el orden de {@code values}. */
    public static <T> List<T> randomNonEmptySubset(Random random, List<T> values) {
        if (values.isEmpty()) {
            throw new IllegalArgumentException("No hay valores entre los que elegir");
        }
        List<T> out;
        do {
            out = randomSubset(random, values);
        } while (out.isEmpty());
        return out;
    }

    /** Elemento aleatorio de una lista no vacía. */
    public static <T> T pick(Random random, List<T> values) {
        if (values.isEmpty()) {
            throw new IllegalArgumentException("No hay valores entre los que elegir");
        }
        return values.get(random.nextInt(values.size()));
    }

    // =====================================================================================================
    // Properties 16 y 17: lotes de importación JSON
    // =====================================================================================================

    /**
     * Plan de un lote con un registro corrupto: {@code validCount} registros válidos y uno corrupto insertado
     * en {@code corruptIndex} (0 = primero, {@code validCount} = último). {@code caseSeed} alimenta el resto de
     * datos del caso (activos, usuario asignado, CVSS...).
     */
    public record BatchPlan(int validCount, int corruptIndex, String corruption, long caseSeed) {
        public int totalSize() {
            return validCount + 1;
        }

        public Random random() {
            return new Random(caseSeed);
        }

        @Override
        public String toString() {
            return "válidos=" + validCount + " corrupto@" + corruptIndex + " (" + corruption + ")";
        }
    }

    /**
     * Planes de lote corrupto (Property 16): enumera todas las combinaciones de tamaño válido
     * ({@code minValid}..{@code maxValid}), posición del corrupto y tipo de corrupción, y completa con planes
     * aleatorios hasta {@code minCases}. Cada plan lleva su propia semilla de caso.
     */
    public static List<BatchPlan> corruptBatchPlans(String property, int minValid, int maxValid,
                                                    List<String> corruptions, int minCases) {
        if (minValid < 0 || maxValid < minValid || corruptions.isEmpty()) {
            throw new IllegalArgumentException("Rango de tamaños o tipos de corrupción no válidos");
        }
        List<BatchPlan> out = new ArrayList<>();
        for (int n = minValid; n <= maxValid; n++) {
            for (int pos = 0; pos <= n; pos++) {
                for (String corruption : corruptions) {
                    out.add(new BatchPlan(n, pos, corruption, caseSeed(property, out.size())));
                }
            }
        }
        Random random = random(property);
        while (out.size() < minCases) {
            int n = minValid + random.nextInt(maxValid - minValid + 1);
            out.add(new BatchPlan(n, random.nextInt(n + 1), pick(random, corruptions),
                    caseSeed(property, out.size())));
        }
        return out;
    }

    /** {@link #corruptBatchPlans} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> corruptBatchPlanCases(String property, int minValid, int maxValid,
                                                          List<String> corruptions, Object... fixedArgs) {
        return cases(property, corruptBatchPlans(property, minValid, maxValid, corruptions, MIN_CASES),
                BatchPlan::toString, fixedArgs);
    }

    /** Tamaño de un caso con su semilla (Property 17: lotes válidos de N registros). */
    public record SizedCase(int size, long caseSeed) {
        public Random random() {
            return new Random(caseSeed);
        }

        @Override
        public String toString() {
            return "N=" + size;
        }
    }

    /**
     * Casos con tamaño entre {@code minSize} y {@code maxSize}: primero cada tamaño una vez (incluidos los dos
     * extremos) y después tamaños aleatorios hasta {@code minCases}.
     */
    public static List<SizedCase> sizedCases(String property, int minSize, int maxSize, int minCases) {
        if (maxSize < minSize) {
            throw new IllegalArgumentException("maxSize < minSize");
        }
        List<SizedCase> out = new ArrayList<>();
        for (int n = minSize; n <= maxSize; n++) {
            out.add(new SizedCase(n, caseSeed(property, out.size())));
        }
        Random random = random(property);
        while (out.size() < minCases) {
            out.add(new SizedCase(minSize + random.nextInt(maxSize - minSize + 1), caseSeed(property, out.size())));
        }
        return out;
    }

    /** {@link #sizedCases} con {@link #MIN_CASES}, listo para {@code @MethodSource}. */
    public static Stream<Arguments> sizedCaseArguments(String property, int minSize, int maxSize,
                                                       Object... fixedArgs) {
        return cases(property, sizedCases(property, minSize, maxSize, MIN_CASES), SizedCase::toString, fixedArgs);
    }

    // =====================================================================================================
    // Motor de variantes (privado)
    // =====================================================================================================

    // Casos en blanco comunes. Con "spacesOnlyAsBlank" se omiten variantes que no son isBlank() (p. ej. NBSP).
    private static void addBlankEdgeCases(Map<String, String> out, Set<String> valid, boolean spacesOnlyAsBlank) {
        put(out, valid, "", "cadena vacía");
        put(out, valid, " ", "un espacio");
        put(out, valid, "   ", "solo espacios");
        put(out, valid, "\t", "tabulador");
        put(out, valid, "\n", "salto de línea");
        put(out, valid, " \t\r\n ", "espacios mezclados");
        if (!spacesOnlyAsBlank) {
            put(out, valid, "\u00A0", "espacio duro (NBSP)");
        }
    }

    // Longitud máxima y máxima + 1: texto de relleno y muestra rellenada con 'X' hasta esas longitudes.
    private static void addLengthEdgeCases(Map<String, String> out, Set<String> valid, String sample, int maxLength) {
        put(out, valid, "X".repeat(maxLength), "longitud máxima " + maxLength);
        put(out, valid, "X".repeat(maxLength + 1), "longitud máxima + 1");
        if (sample.length() < maxLength) {
            put(out, valid, padRight(sample, maxLength), "valor rellenado hasta la longitud máxima");
        }
        put(out, valid, padRight(sample, Math.max(maxLength + 1, sample.length() + 1)),
                "valor rellenado hasta máxima + 1");
    }

    // Variantes deterministas de un valor válido.
    private static void addSystematicMutations(Map<String, String> out, Set<String> valid, String v, Random random) {
        put(out, valid, v.toLowerCase(Locale.ROOT), "minúsculas");
        put(out, valid, v.toUpperCase(Locale.ROOT), "mayúsculas");
        put(out, valid, capitalize(v), "solo inicial mayúscula");
        put(out, valid, stripAccents(v), "sin tilde");
        put(out, valid, lowercaseAccentedChars(v), "tilde en minúscula");
        put(out, valid, Normalizer.normalize(v, Normalizer.Form.NFD), "tilde descompuesta (NFD)");
        put(out, valid, " " + v, "espacio inicial");
        put(out, valid, v + " ", "espacio final");
        put(out, valid, " " + v + " ", "espacios alrededor");
        put(out, valid, v + "\t", "tabulador final");
        put(out, valid, v + "\n", "salto de línea final");
        put(out, valid, v + "\u00A0", "espacio duro final");
        if (v.contains(" ")) {
            put(out, valid, v.replaceFirst(" ", "  "), "doble espacio");
            put(out, valid, v.replace(" ", ""), "sin espacios");
            put(out, valid, v.replace(" ", "_"), "guion bajo en vez de espacio");
        }
        if (!v.isEmpty()) {
            put(out, valid, v.substring(0, v.length() - 1), "último carácter eliminado");
            put(out, valid, v.substring(1), "primer carácter eliminado");
            put(out, valid, v + v.charAt(v.length() - 1), "último carácter duplicado");
            put(out, valid, v + v, "valor repetido");
        }
        if (v.matches("\\d+(\\.\\d+)+")) {
            for (int i = 0; i < v.length(); i++) {
                char c = v.charAt(i);
                if (Character.isDigit(c)) {
                    if (c > '0') {
                        put(out, valid, replaceAt(v, i, (char) (c - 1)), "dígito " + i + " - 1");
                    }
                    if (c < '9') {
                        put(out, valid, replaceAt(v, i, (char) (c + 1)), "dígito " + i + " + 1");
                    }
                }
            }
            put(out, valid, v.replace('.', ','), "coma decimal");
            put(out, valid, v.replace(".", ""), "sin punto");
            put(out, valid, v + "0", "cero final");
            put(out, valid, "0" + v, "cero inicial");
        }
        for (int i = 0; i < v.length(); i++) {
            put(out, valid, replaceAt(v, i, otherChar(random, v.charAt(i))), "carácter " + i + " cambiado");
            put(out, valid, v.substring(0, i) + v.substring(i + 1), "carácter " + i + " eliminado");
        }
    }

    // Completa con mutaciones aleatorias de las muestras hasta minCases.
    private static void fillWithRandomMutations(Map<String, String> out, List<String> samples, Integer maxLength,
                                                int minCases, Random random,
                                                Predicate<String> accept) {
        int attempts = 0;
        int maxAttempts = Math.max(minCases, 1) * ATTEMPTS_PER_CASE;
        while (out.size() < minCases && attempts++ < maxAttempts) {
            Variant variant = randomMutation(random, pick(random, samples), maxLength);
            if (accept.test(variant.text())) {
                out.putIfAbsent(variant.text(), variant.kind());
            }
        }
        if (out.size() < minCases) {
            throw new IllegalStateException("Solo se pudieron generar " + out.size() + " de " + minCases + " casos");
        }
    }

    private static Variant randomMutation(Random random, String v, Integer maxLength) {
        if (v.isEmpty()) {
            return new Variant(String.valueOf(randomChar(random)), "carácter aleatorio");
        }
        int pos = random.nextInt(v.length());
        return switch (random.nextInt(6)) {
            case 0 -> new Variant(replaceAt(v, pos, otherChar(random, v.charAt(pos))),
                    "aleatorio: carácter " + pos + " cambiado");
            case 1 -> new Variant(v.substring(0, pos) + randomChar(random) + v.substring(pos),
                    "aleatorio: carácter insertado en " + pos);
            case 2 -> pos + 1 < v.length()
                    ? new Variant(v.substring(0, pos) + v.charAt(pos + 1) + v.charAt(pos) + v.substring(pos + 2),
                    "aleatorio: caracteres " + pos + " y " + (pos + 1) + " intercambiados")
                    : new Variant(v + randomChar(random), "aleatorio: carácter añadido al final");
            case 3 -> new Variant(flipCase(v, pos), "aleatorio: mayúscula/minúscula cambiada en " + pos);
            case 4 -> {
                int a = random.nextInt(v.length());
                int b = random.nextInt(v.length());
                yield new Variant(replaceAt(replaceAt(v, a, otherChar(random, v.charAt(a))), b,
                        otherChar(random, v.charAt(b))), "aleatorio: dos caracteres cambiados");
            }
            default -> {
                int limit = maxLength == null ? v.length() + 5 : maxLength + 1;
                int length = 1 + random.nextInt(Math.max(1, limit));
                StringBuilder sb = new StringBuilder(length);
                for (int i = 0; i < length; i++) {
                    sb.append(randomChar(random));
                }
                yield new Variant(sb.toString(), "aleatorio: texto de longitud " + length);
            }
        };
    }

    // Número de casos límite deterministas que genera invalidRequiredTexts para un campo (sin los aleatorios).
    private static int edgeCaseCount(FieldSpec field) {
        int blanks = 1 + 6; // nulo + addBlankEdgeCases(spacesOnlyAsBlank = true)
        return field.maxLength() == null ? blanks : blanks + 3;
    }

    private static String textForField(Random random, int length, boolean emailShaped) {
        return emailShaped && length > EMAIL_DOMAIN.length() ? emailOfLength(random, length)
                : textOfLength(random, length);
    }

    private static void put(Map<String, String> out, Set<String> valid, String text, String kind) {
        if (text != null && !valid.contains(text)) {
            out.putIfAbsent(text, kind);
        }
    }

    private static List<Variant> toVariants(Map<String, String> out) {
        List<Variant> variants = new ArrayList<>(out.size());
        out.forEach((text, kind) -> variants.add(new Variant(text, kind)));
        return variants;
    }

    private static List<String> texts(List<Variant> variants) {
        return variants.stream().map(Variant::text).collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    // Describe por posición para que valores repetidos en listas distintas conserven su tipo de variante.
    private static Function<String, String> indexDescriber(List<Variant> variants) {
        Map<String, String> kinds = new LinkedHashMap<>();
        variants.forEach(v -> kinds.putIfAbsent(v.text(), v.kind()));
        return text -> visible(text) + " [" + kinds.get(text) + "]";
    }

    private static String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private static String lowercaseAccentedChars(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            boolean accented = !stripAccents(String.valueOf(c)).equals(String.valueOf(c));
            sb.append(accented ? Character.toLowerCase(c) : c);
        }
        return sb.toString();
    }

    private static String capitalize(String s) {
        if (s.isEmpty()) {
            return s;
        }
        return s.substring(0, 1).toUpperCase(Locale.ROOT) + s.substring(1).toLowerCase(Locale.ROOT);
    }

    private static String flipCase(String s, int pos) {
        char c = s.charAt(pos);
        char flipped = Character.isUpperCase(c) ? Character.toLowerCase(c) : Character.toUpperCase(c);
        return replaceAt(s, pos, flipped);
    }

    private static String replaceAt(String s, int pos, char c) {
        return s.substring(0, pos) + c + s.substring(pos + 1);
    }

    private static String padRight(String s, int length) {
        return s + "X".repeat(Math.max(0, length - s.length()));
    }

    private static char randomChar(Random random) {
        return MUTATION_ALPHABET.charAt(random.nextInt(MUTATION_ALPHABET.length()));
    }

    private static char otherChar(Random random, char original) {
        char c;
        do {
            c = randomChar(random);
        } while (c == original);
        return c;
    }

    private static long propertySeed(String property) {
        return mix64(SEED ^ (0xC2B2AE3D27D4EB4FL * property.hashCode()));
    }

    // Mezclador de SplitMix64: reparte bien semillas consecutivas.
    private static long mix64(long z) {
        z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9L;
        z = (z ^ (z >>> 27)) * 0x94D049BB133111EBL;
        return z ^ (z >>> 31);
    }
}
