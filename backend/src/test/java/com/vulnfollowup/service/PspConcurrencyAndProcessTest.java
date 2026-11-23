package com.vulnfollowup.service;

import com.vulnfollowup.dto.ApiDtos.VulnerabilitySummaryDto;
import com.vulnfollowup.dto.VulnerabilityCreateCommand;
import com.vulnfollowup.model.enums.*;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pruebas unitarias y de estres para los 3 pilares de Programacion de Servicios y Procesos (PSP 2.º DAM):
 * 1. Condicion de carrera y exclusion mutua con ReentrantLock / AtomicInteger y CountDownLatch.
 * 2. Procesamiento concurrente de lotes CVSS con ThreadPoolExecutor (ExecutorService).
 * 3. Generacion de informes CSV y HTML en subproceso del sistema operativo con ProcessBuilder.
 */
class PspConcurrencyAndProcessTest {

    private PspConcurrencyAndProcessService pspService;

    @BeforeEach
    void setUp() {
        pspService = new PspConcurrencyAndProcessService();
    }

    @AfterEach
    void tearDown() {
        pspService.shutdownGracefully();
    }

    @Test
    @DisplayName("PSP 1: Test de estres concurrente (32 hilos x 1000 ops) con ReentrantLock y AtomicInteger sin perdida de datos")
    void concurrentSharedResourceProtectionPreventsRaceCondition() throws InterruptedException {
        int threads = 32;
        int incrementsPerThread = 1_000;
        int expectedTotal = threads * incrementsPerThread;

        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(threads);
        ExecutorService stressPool = Executors.newFixedThreadPool(threads);

        for (int i = 0; i < threads; i++) {
            stressPool.submit(() -> {
                try {
                    startGate.await();
                    for (int j = 0; j < incrementsPerThread; j++) {
                        pspService.recordTriagedSafely(CvssSeverity.CRITICAL);
                        pspService.recordTriagedUnsafe();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    doneGate.countDown();
                }
            });
        }

        startGate.countDown();
        assertTrue(doneGate.await(15, TimeUnit.SECONDS), "Todos los hilos deben terminar dentro del timeout");
        stressPool.shutdown();

        assertEquals(expectedTotal, pspService.getLockedTotalCounter(),
                "El contador protegido con ReentrantLock nunca pierde incrementos");
        assertEquals(expectedTotal, pspService.getAtomicCriticalCounter(),
                "El contador AtomicInteger de criticas nunca pierde incrementos");
        assertEquals(expectedTotal, pspService.getSeveritySnapshot().get(CvssSeverity.CRITICAL));
    }

    @Test
    @DisplayName("PSP 2: ExecutorService (ThreadPoolExecutor) valida lotes CVSS en paralelo y propaga errores de incoherencia")
    void executorServiceValidatesCvssBatchInParallel() {
        List<VulnerabilityCreateCommand> validBatch = new ArrayList<>();
        for (int i = 1; i <= 16; i++) {
            validBatch.add(new VulnerabilityCreateCommand(
                    String.format("VFU-%04d", 100 + i),
                    String.format("CVE-2026-%05d", 10000 + i),
                    "Vulnerabilidad concurrente #" + i,
                    "Validacion paralela en pool de hilos PSP",
                    VulnerabilityStatus.ABIERTA,
                    CvssVersion.V3_1,
                    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                    new BigDecimal("9.8"),
                    CvssSeverity.CRITICAL,
                    null,
                    null,
                    LocalDate.now(),
                    null,
                    List.of(8)
            ));
        }

        Set<String> workers = pspService.validateBatchConcurrently(validBatch);
        assertFalse(workers.isEmpty());
        assertTrue(workers.stream().allMatch(name -> name.startsWith("vfu-psp-worker-")),
                "Las tareas deben ejecutarse en los hilos nombrados del ThreadPoolExecutor: " + workers);
        assertEquals(16, pspService.getLockedTotalCounter());

        List<VulnerabilityCreateCommand> corruptBatch = new ArrayList<>(validBatch.subList(0, 3));
        corruptBatch.add(new VulnerabilityCreateCommand(
                "VFU-0999",
                "CVE-2026-99999",
                "Registro corrupto 9.8 con LOW",
                "Falla en validacion paralela",
                VulnerabilityStatus.ABIERTA,
                CvssVersion.V3_1,
                "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                new BigDecimal("9.8"),
                CvssSeverity.LOW,
                null,
                null,
                LocalDate.now(),
                null,
                List.of(8)
        ));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> pspService.validateBatchConcurrently(corruptBatch)
        );
        assertTrue(ex.getMessage().contains("Incoherencia CVSS"));
    }

    @Test
    @DisplayName("PSP 3: ProcessBuilder lanza subproceso del SO para exportar informes CSV y HTML con exitValue == 0")
    void processBuilderSpawnsChildProcessToGenerateCsvAndHtmlReports() {
        List<VulnerabilitySummaryDto> sampleItems = List.of(
                new VulnerabilitySummaryDto(
                        12,
                        "VFU-0012",
                        "CVE-2024-21762",
                        "RCE en pasarela API de pagos",
                        "PENDIENTE DE REMEDIACIÓN",
                        "3.1",
                        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                        new BigDecimal("9.8"),
                        CvssSeverity.CRITICAL,
                        2,
                        "analyst_soc",
                        LocalDate.of(2026, 2, 10),
                        LocalDate.of(2026, 3, 1),
                        2,
                        "HostingSur S.L."
                )
        );

        String csvReport = pspService.generateReportViaOsProcess("CSV", sampleItems);
        assertTrue(csvReport.contains("internal_code,cve_id,title,cvss_version,cvss_score,severity,status,primary_provider"));
        assertTrue(csvReport.contains("VFU-0012,CVE-2024-21762,RCE en pasarela API de pagos,3.1,9.8,CRITICAL"));
        assertTrue(csvReport.contains("HostingSur S.L."));

        String htmlReport = pspService.generateReportViaOsProcess("HTML", sampleItems);
        assertTrue(htmlReport.contains("<!DOCTYPE html>"));
        assertTrue(htmlReport.contains("VFU-0012"));
        assertTrue(htmlReport.contains("HostingSur S.L."));

        assertThrows(IllegalArgumentException.class,
                () -> pspService.generateReportViaOsProcess("EXE", sampleItems));
    }
}
