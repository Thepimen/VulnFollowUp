package com.vulnfollowup.support;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Named;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.provider.Arguments;

import com.vulnfollowup.support.Generators.BatchPlan;
import com.vulnfollowup.support.Generators.FieldSpec;
import com.vulnfollowup.support.Generators.Variant;

/** Comprueba que los generadores son deterministas, suficientes y contienen los casos límite. */
class GeneratorsTest {

    private static final List<String> STATUS =
            List.of("ABIERTA", "PENDIENTE DE REMEDIACIÓN", "RESUELTA", "CERRADA");
    private static final List<Integer> ASSET_IDS = List.of(1, 2, 3, 4, 5, 6, 7, 8);

    @Test
    void textosDeEnumInvalidosSonDeterministasSuficientesYNuncaValidos() {
        List<Variant> first = Generators.invalidEnumTexts("P2-status", STATUS, 30, Generators.MIN_CASES);
        List<Variant> second = Generators.invalidEnumTexts("P2-status", STATUS, 30, Generators.MIN_CASES);
        List<String> texts = first.stream().map(Variant::text).toList();

        assertEquals(first, second);
        assertTrue(texts.size() >= Generators.MIN_CASES);
        assertEquals(texts.size(), new HashSet<>(texts).size(), "sin duplicados");
        texts.forEach(t -> assertFalse(STATUS.contains(t), "no debe contener un valor válido: " + t));
        assertTrue(texts.containsAll(List.of("", " ", "   ", "PENDIENTE DE REMEDIACION", "abierta",
                "X".repeat(30), "X".repeat(31))));
    }

    @Test
    void textosDeEnumInvalidosIncluyenLosEjemplosDelCriterio5_9() {
        assertTrue(texts(Generators.invalidEnumTexts("P2-severity",
                List.of("NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"), 10, 100)).contains("critical"));
        assertTrue(texts(Generators.invalidEnumTexts("P2-version", List.of("3.1", "4.0"), 3, 100)).contains("3.0"));
    }

    @Test
    void nombresDeCasoIncluyenSemillaEIndice() {
        List<Arguments> args = Generators.invalidEnumTextCases("P2-status", STATUS, 30).toList();
        for (int i = 0; i < args.size(); i++) {
            String name = ((Named<?>) args.get(i).get()[0]).getName();
            assertTrue(name.contains("seed=" + Generators.SEED) && name.contains("caso=" + i + ":"), name);
        }
    }

    @Test
    void codigosInvalidosNoCumplenElPatron() {
        List<String> codes = texts(Generators.invalidInternalCodes(100));
        assertTrue(codes.size() >= 100);
        assertTrue(codes.contains(null) && codes.containsAll(List.of("", "vfu-0001", "VFU-001", "VFU0001")));
        codes.stream().filter(c -> c != null)
                .forEach(c -> assertFalse(Generators.INTERNAL_CODE_PATTERN.matcher(c).matches(), c));

        List<String> cves = texts(Generators.invalidCveIds(100));
        assertFalse(cves.contains(null));
        cves.forEach(c -> assertFalse(Generators.CVE_ID_PATTERN.matcher(c).matches(), c));
    }

    @Test
    void codigosValidosCumplenElPatronYSonDistintos() {
        var random = Generators.caseRandom("P10", 0);
        assertValid(Generators.validInternalCodes(random, 6), Generators.INTERNAL_CODE_PATTERN, 20);
        assertValid(Generators.validCveIds(random, 6), Generators.CVE_ID_PATTERN, 30);
    }

    @Test
    void casosDeCampoInvalidoCubrenCadaCampoConBlancosYLongitudMaximaMasUno() {
        List<FieldSpec> fields = List.of(FieldSpec.text("username", 50), FieldSpec.email("email", 120),
                FieldSpec.text("fullName", 100), FieldSpec.text("password", null),
                FieldSpec.oneOf("role", 20, List.of("ADMIN", "ANALYST", "VIEWER")));
        List<Object[]> cases = Generators.singleInvalidFieldCases("P20", fields, 100)
                .map(Arguments::get).toList();

        assertTrue(cases.size() >= 100);
        for (FieldSpec field : fields) {
            List<String> values = cases.stream()
                    .filter(c -> ((Named<?>) c[0]).getPayload().equals(field.name()))
                    .map(c -> (String) c[1]).toList();
            assertTrue(values.contains(null) && values.contains("") && values.contains("   "), field.name());
            if (field.maxLength() != null) {
                assertTrue(values.stream().anyMatch(v -> v != null && v.length() == field.maxLength() + 1),
                        field.name());
            }
        }
        cases.stream().filter(c -> "role".equals(((Named<?>) c[0]).getPayload()))
                .forEach(c -> assertFalse(c[1] != null && Set.of("ADMIN", "ANALYST", "VIEWER").contains(c[1])));
    }

    @Test
    void listasDeActivosConRepeticionesYConInexistentes() {
        List<List<Integer>> repeats = Generators.listsWithRepeats("P11", ASSET_IDS, 100);
        assertTrue(repeats.size() >= 100);
        repeats.forEach(l -> {
            assertTrue(ASSET_IDS.containsAll(l));
            assertTrue(new HashSet<>(l).size() < l.size(), "debe haber repetición: " + l);
        });

        List<List<Integer>> missing = Generators.listsWithMissingIds("P10-assets", ASSET_IDS, 100);
        assertTrue(missing.size() >= 100);
        missing.forEach(l -> assertFalse(Generators.missingIds(l, ASSET_IDS).isEmpty(), l.toString()));
        assertEquals(List.of(9), Generators.missingIds(List.of(1, 9, 9, 8), ASSET_IDS));
    }

    @Test
    void planesDeLoteCubrenTodasLasPosiciones() {
        List<String> kinds = List.of("ASSIGNED_TO_INEXISTENTE", "ACTIVO_INEXISTENTE", "CVSS_INCOHERENTE");
        List<BatchPlan> plans = Generators.corruptBatchPlans("P16", 1, 6, kinds, 100);
        assertTrue(plans.size() >= 100);
        Set<String> combos = new HashSet<>();
        plans.forEach(p -> {
            assertTrue(p.validCount() >= 1 && p.validCount() <= 6);
            assertTrue(p.corruptIndex() >= 0 && p.corruptIndex() <= p.validCount());
            combos.add(p.validCount() + "/" + p.corruptIndex() + "/" + p.corruption());
        });
        assertEquals(81, combos.size(), "todas las combinaciones (tamaño, posición, corrupción)");

        var sizes = Generators.sizedCases("P17", 1, 6, 100);
        assertTrue(sizes.size() >= 100);
        assertEquals(Set.of(1, 2, 3, 4, 5, 6),
                new HashSet<>(sizes.stream().map(Generators.SizedCase::size).toList()));
    }

    private static List<String> texts(List<Variant> variants) {
        return variants.stream().map(Variant::text).toList();
    }

    private static void assertValid(List<String> values, Pattern pattern, int maxLength) {
        assertEquals(values.size(), new HashSet<>(values).size());
        values.forEach(v -> assertTrue(pattern.matcher(v).matches() && v.length() <= maxLength, v));
    }
}
