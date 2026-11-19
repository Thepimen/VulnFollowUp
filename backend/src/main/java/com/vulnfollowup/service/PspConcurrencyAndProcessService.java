package com.vulnfollowup.service;

import com.vulnfollowup.dto.ApiDtos.VulnerabilitySummaryDto;
import com.vulnfollowup.dto.VulnerabilityCreateCommand;
import com.vulnfollowup.model.enums.CvssSeverity;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Servicio que implementa los 3 pilares obligatorios de Programacion de Servicios y Procesos (PSP 2.º DAM):
 * 1. Proteccion de recurso compartido en memoria con ReentrantLock y AtomicInteger frente a condiciones de carrera.
 * 2. Procesamiento concurrente de lotes CVSS mediante ThreadPoolExecutor (ExecutorService acotado).
 * 3. Generacion de informes ejecutivos CSV/HTML lanzando un subproceso del SO con ProcessBuilder.
 */
@Service
public class PspConcurrencyAndProcessService {

    public static final int WORKER_THREADS = 4;

    private final ReentrantLock triageLock = new ReentrantLock();
    private final AtomicInteger atomicCriticalCounter = new AtomicInteger(0);
    private final Map<CvssSeverity, Integer> severityTriageMap = new EnumMap<>(CvssSeverity.class);
    private int lockedTotalCounter = 0;
    private int unsafeTotalCounter = 0;

    private final AtomicInteger threadSeq = new AtomicInteger(1);
    private final ThreadPoolExecutor batchExecutor = new ThreadPoolExecutor(
            WORKER_THREADS,
            WORKER_THREADS * 2,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(200),
            r -> {
                Thread t = new Thread(r, "vfu-psp-worker-" + threadSeq.getAndIncrement());
                t.setDaemon(true);
                return t;
            },
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    public PspConcurrencyAndProcessService() {
        resetCounters();
    }

    /**
     * Incrementa el contador compartido sin sincronizacion para demostrar la condicion de carrera
     * (race condition) bajo concurrencia en las pruebas de estres de PSP.
     */
    public void recordTriagedUnsafe() {
        int current = unsafeTotalCounter;
        Thread.onSpinWait();
        unsafeTotalCounter = current + 1;
    }

    /**
     * Incrementa los contadores compartidos en memoria protegiendo la seccion critica
     * con exclusion mutua (ReentrantLock) y variables atomicas (AtomicInteger).
     */
    public void recordTriagedSafely(CvssSeverity severity) {
        if (severity == CvssSeverity.CRITICAL) {
            atomicCriticalCounter.incrementAndGet();
        }
        triageLock.lock();
        try {
            lockedTotalCounter++;
            if (severity != null) {
                severityTriageMap.merge(severity, 1, Integer::sum);
            }
        } finally {
            triageLock.unlock();
        }
    }

    public int getLockedTotalCounter() {
        triageLock.lock();
        try {
            return lockedTotalCounter;
        } finally {
            triageLock.unlock();
        }
    }

    public int getUnsafeTotalCounter() {
        return unsafeTotalCounter;
    }

    public int getAtomicCriticalCounter() {
        return atomicCriticalCounter.get();
    }

    public Map<CvssSeverity, Integer> getSeveritySnapshot() {
        triageLock.lock();
        try {
            return new EnumMap<>(severityTriageMap);
        } finally {
            triageLock.unlock();
        }
    }

    public final void resetCounters() {
        triageLock.lock();
        try {
            lockedTotalCounter = 0;
            unsafeTotalCounter = 0;
            atomicCriticalCounter.set(0);
            for (CvssSeverity sev : CvssSeverity.values()) {
                severityTriageMap.put(sev, 0);
            }
        } finally {
            triageLock.unlock();
        }
    }

    /**
     * Valida en paralelo un lote de vulnerabilidades usando el pool de hilos (ExecutorService).
     * Devuelve el conjunto de nombres de hilos trabajadores que participaron.
     */
    public Set<String> validateBatchConcurrently(List<VulnerabilityCreateCommand> commands) {
        if (commands == null || commands.isEmpty()) {
            return Set.of();
        }
        Set<String> workerNames = ConcurrentHashMap.newKeySet();
        List<CompletableFuture<Void>> futures = new ArrayList<>(commands.size());

        for (VulnerabilityCreateCommand cmd : commands) {
            futures.add(CompletableFuture.runAsync(() -> {
                workerNames.add(Thread.currentThread().getName());
                CvssValidator.validate(cmd.cvssVersion(), cmd.cvssVector(), cmd.cvssScore(), cmd.severity());
                recordTriagedSafely(cmd.severity());
            }, batchExecutor));
        }

        try {
            for (CompletableFuture<Void> future : futures) {
                future.join();
            }
        } catch (CompletionException ex) {
            if (ex.getCause() instanceof RuntimeException runtimeEx) {
                throw runtimeEx;
            }
            throw new IllegalStateException("Error en validacion concurrente: " + ex.getMessage(), ex);
        }
        return workerNames;
    }

    /**
     * Lanza un subproceso del sistema operativo independiente mediante ProcessBuilder
     * (sin interpolacion de shell) para compilar un informe ejecutivo CSV o HTML.
     */
    public String generateReportViaOsProcess(String format, List<VulnerabilitySummaryDto> items) {
        if (format == null || format.isBlank()) {
            throw new IllegalArgumentException("El parametro format es obligatorio (CSV o HTML)");
        }
        String normalizedFormat = format.trim().toUpperCase(Locale.ROOT);
        if (!"CSV".equals(normalizedFormat) && !"HTML".equals(normalizedFormat)) {
            throw new IllegalArgumentException("Formato de informe no soportado: " + format + " (use CSV o HTML)");
        }

        Path inputTsv = null;
        Path outputReport = null;
        try {
            inputTsv = Files.createTempFile("vfu-report-in-", ".tsv");
            outputReport = Files.createTempFile("vfu-report-out-", "." + normalizedFormat.toLowerCase(Locale.ROOT));

            List<String> lines = new ArrayList<>();
            if (items != null) {
                for (VulnerabilitySummaryDto v : items) {
                    lines.add(String.join("\t",
                            cleanTab(v.internalCode()),
                            cleanTab(v.cveId()),
                            cleanTab(v.title()),
                            cleanTab(v.cvssVersion()),
                            v.cvssScore() != null ? v.cvssScore().toPlainString() : "",
                            v.severity() != null ? v.severity().getDbValue() : "",
                            cleanTab(v.status()),
                            cleanTab(v.primaryProviderName())
                    ));
                }
            }
            Files.write(inputTsv, lines, StandardCharsets.UTF_8);

            String javaBin = Path.of(System.getProperty("java.home"), "bin", "java").toString();
            String workerClasspath;
            try {
                workerClasspath = Path.of(
                        PspReportWorker.class.getProtectionDomain().getCodeSource().getLocation().toURI()
                ).toString();
            } catch (Exception e) {
                workerClasspath = System.getProperty("java.class.path");
            }

            ProcessBuilder pb = new ProcessBuilder(
                    javaBin,
                    "-cp",
                    workerClasspath,
                    PspReportWorker.class.getName(),
                    normalizedFormat,
                    inputTsv.toAbsolutePath().toString(),
                    outputReport.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            String processLog;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                processLog = reader.lines().reduce("", (a, b) -> a.isEmpty() ? b : a + "\n" + b);
            }

            boolean finished = process.waitFor(20, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new IllegalStateException("Timeout (20s) superado en el proceso ProcessBuilder de informes");
            }
            if (process.exitValue() != 0) {
                throw new IllegalStateException(
                        "El proceso externo de informes termino con codigo " + process.exitValue() + ": " + processLog);
            }

            return Files.readString(outputReport, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Error de E/S lanzando ProcessBuilder: " + ex.getMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Ejecucion de ProcessBuilder interrumpida", ex);
        } finally {
            deleteQuietly(inputTsv);
            deleteQuietly(outputReport);
        }
    }

    @PreDestroy
    public void shutdownGracefully() {
        batchExecutor.shutdown();
        try {
            if (!batchExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                batchExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            batchExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    private static String cleanTab(String val) {
        return val == null ? "" : val.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ');
    }

    private static void deleteQuietly(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
            } catch (IOException ignored) {
            }
        }
    }
}
