---
name: java-backend-concurrency
description: "Implements thread-safe Java backend services, concurrent batch CVE processing with ExecutorService, synchronized shared-state protection with race-condition JUnit tests, OS report generation with ProcessBuilder, and ACID JPA/JDBC transactions. Use when building or testing Java backend endpoints, concurrency mechanisms, or external process execution in VulnFollowUp."
---

# Java Backend, Concurrency & Process Management (DAM PSP / AD)

## Overview

This skill enforces production-grade Java backend engineering tailored to the **VulnFollowUp** architecture (`backend/`), combining **Acceso a Datos (AD)** and **Programación de Servicios y Procesos (PSP)** requirements. Every concurrent, transactional, or OS-process feature must strictly follow these patterns.

## When to Use

- Implementing REST API controllers, service layers, and DTO mappers in `backend/`
- Writing concurrent CVE/NVD ingestion jobs or parallel risk-recalculation tasks using `ExecutorService`
- Protecting shared in-memory resources (counters, caches, audit buffers) with `ReentrantLock`, `synchronized`, or `java.util.concurrent.atomic`
- Writing deterministic JUnit 5 concurrency unit tests (`CountDownLatch` / `CyclicBarrier`) that prove thread safety vs. race conditions
- Spawning OS-level child processes via `ProcessBuilder` to generate CSV or HTML vulnerability and DORA compliance reports
- Managing relational persistence with Spring Data JPA / Hibernate or JDBC `PreparedStatement` with strict ACID transaction rollbacks

---

## Core Architectural Rules

### 1. Thread Pool Management (`ExecutorService`)
Never spawn raw unmanaged `new Thread()` instances in request handlers or batch jobs. Always use a bounded, named `ExecutorService`:

```java
import java.util.concurrent.*;

public class VulnerabilityBatchProcessor {
    private final ExecutorService executor = new ThreadPoolExecutor(
        4, 8, 60L, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(200),
        r -> {
            Thread t = new Thread(r);
            t.setName("vuln-worker-" + t.threadId());
            t.setDaemon(true);
            return t;
        },
        new ThreadPoolExecutor.CallerRunsPolicy()
    );

    public CompletableFuture<BatchSummary> processCveBatchAsync(List<CvePayload> payloads) {
        return CompletableFuture.supplyAsync(() -> {
            // Process batch safely
            return executeBatch(payloads);
        }, executor);
    }

    public void shutdownGracefully() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(15, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```

### 2. Shared Resource Protection & Race Condition Unit Testing (Mandatory PSP Requirement)
When multiple threads update a shared counter, critical-severity accumulator, or SLA cache:
1. **Protect the critical section** using `ReentrantLock`, `ReadWriteLock`, `AtomicInteger`/`LongAdder`, or `ConcurrentHashMap.compute()`.
2. **Prove thread safety with a JUnit 5 test** using `CountDownLatch` to release $N$ threads simultaneously:

```java
@Test
void shouldPreventRaceConditionUnderConcurrentUpdates() throws InterruptedException {
    int threads = 32;
    int incrementsPerThread = 1_000;
    CountDownLatch startGate = new CountDownLatch(1);
    CountDownLatch doneGate = new CountDownLatch(threads);
    ExecutorService pool = Executors.newFixedThreadPool(threads);

    SharedVulnerabilityMetrics metrics = new SharedVulnerabilityMetrics();

    for (int i = 0; i < threads; i++) {
        pool.submit(() -> {
            try {
                startGate.await();
                for (int j = 0; j < incrementsPerThread; j++) {
                    metrics.recordCriticalVulnerabilitySafely();
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                doneGate.countDown();
            }
        });
    }

    startGate.countDown(); // Release all threads at the exact same instant
    assertTrue(doneGate.await(10, TimeUnit.SECONDS));
    pool.shutdown();

    assertEquals(threads * incrementsPerThread, metrics.getCriticalCount());
}
```

### 3. Safe OS Process Spawning (`ProcessBuilder`)
For exporting CSV/HTML executive vulnerability reports via OS utilities or helper scripts:
- **Never** pass unsanitized user strings into `cmd.exe /c` or `/bin/sh -c` (prevents CWE-78 OS Command Injection).
- Pass arguments as discrete elements in `List<String>`.
- Always consume `stdout`/`stderr` streams (or use `redirectErrorStream(true)`) and enforce a timeout with `process.waitFor(timeout, TimeUnit.SECONDS)` so zombie processes never hang the JVM.

```java
public Path exportExecutiveReport(Path inputJson, Path outputHtml) throws IOException, InterruptedException {
    // Validate paths are strictly inside the designated reports directory
    Path safeInput = validateWithinReportsDir(inputJson);
    Path safeOutput = validateWithinReportsDir(outputHtml);

    ProcessBuilder pb = new ProcessBuilder(
        "python", "scripts/export_report.py",
        "--input", safeInput.toString(),
        "--output", safeOutput.toString()
    );
    pb.redirectErrorStream(true);

    Process process = pb.start();
    String output;
    try (var reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
        output = reader.lines().collect(Collectors.joining("\n"));
    }

    boolean finished = process.waitFor(30, TimeUnit.SECONDS);
    if (!finished) {
        process.destroyForcibly();
        throw new TimeoutException("Report export process timed out after 30s");
    }
    if (process.exitValue() != 0) {
        throw new IllegalStateException("Report export failed (exit " + process.exitValue() + "): " + output);
    }
    return safeOutput;
}
```

### 4. Transactional Integrity & Green Software Pagination (AD + Sustainability)
- Annotate mutating service methods with `@Transactional(rollbackFor = Exception.class)` (or explicit `connection.setAutoCommit(false)` with `connection.rollback()` in `catch` blocks when using raw JDBC).
- Enforce **strict server-side pagination** (`Pageable` / `LIMIT ? OFFSET ?`) on every collection endpoint (`/api/v1/vulnerabilities`, `/api/v1/assets`, `/api/v1/ict-providers`), capping `size <= 100` to minimize memory footprint and network payload (Green Software principle).

## Verification Checklist
- [ ] All `ExecutorService` pools have bounded queues and graceful shutdown hooks.
- [ ] Shared mutable state is guarded by locks or atomic primitives and verified by a concurrent JUnit test.
- [ ] `ProcessBuilder` uses argument lists (no shell interpolation), consumes output streams, and enforces a timeout.
- [ ] Mutating operations roll back cleanly on failure, leaving zero orphan rows in `vulnerability_assets`.
