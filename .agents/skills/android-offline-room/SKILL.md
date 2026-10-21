---
name: android-offline-room
description: "Builds Kotlin/Java Android Native mobile screens (android-app/) with offline-first Room persistence, EncryptedSharedPreferences/DataStore JWT session storage, Retrofit REST synchronization, and WCAG 2.1 AA Material 3 UI. Use when working in android-app/ on mobile layouts, local SQLite/Room cache, or API sync."
---

# Android Native Development with Offline Room Cache (DAM PMDM)

## Overview

This skill governs the development of the **VulnFollowUp** Android client (`android-app/`) for the **Programación Multimedia y Dispositivos Móviles (PMDM)** module. The mobile app enables field analysts and security managers to inspect critical vulnerabilities, check ICT provider risk status, and transition vulnerability states with **offline-first resilience** via **Room (SQLite)** and **DataStore / EncryptedSharedPreferences**.

## When to Use

- Designing or implementing Activities, Fragments, or Jetpack Compose / Material 3 XML views in `android-app/`
- Defining local Room `@Entity`, `@Dao`, and `@Database` classes for offline access to vulnerabilities and assets
- Implementing the Offline-First Repository pattern (Network-bound resource with Retrofit + Room cache fallback)
- Storing JWT tokens and user role (`ADMIN`, `ANALYST`, `VIEWER`) securely on device
- Enforcing mobile accessibility (48x48dp touch targets, `contentDescription`, high-contrast severity badges)

---

## Architecture & Offline-First Pattern

```
┌────────────────────────────────────────────────────────┐
│  UI Layer (Material 3 Views / Compose + ViewModel)     │
│  Observes StateFlow<UiState<List<VulnerabilityItem>>>  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  VulnerabilityRepository (Single Source of Truth)      │
│  1. Emits cached Room entities immediately             │
│  2. Fetches paginated REST API via Retrofit            │
│  3. Upserts fresh data into Room within @Transaction   │
│  4. Queues status updates when offline (WorkManager)   │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Local Data Source (Room) │  │ Remote Data Source (API) │
│ - VulnerabilityEntity    │  │ - VulnFollowUpApiService │
│ - AssetEntity            │  │ - AuthInterceptor (JWT)  │
│ - PendingSyncQueueEntity │  │ - PaginatedResponse<T>   │
└──────────────────────────┘  └──────────────────────────┘
```

### 1. Local Room Entities & DAOs
Mirror the core fields needed for mobile consultation without bloating device storage (Green Software):

```kotlin
@Entity(
    tableName = "cached_vulnerabilities",
    indices = [Index(value = ["status", "severity", "cvssScore"])]
)
data class VulnerabilityEntity(
    @PrimaryKey val id: Long,
    val cveId: String,
    val title: String,
    val cvssVersion: String, // "3.1" or "4.0"
    val cvssVector: String,
    val cvssScore: Double,
    val severity: String,    // NONE, LOW, MEDIUM, HIGH, CRITICAL
    val status: String,      // ABIERTA, PENDIENTE DE REMEDIACIÓN, RESUELTA, CERRADA
    val affectedAssetsCount: Int,
    val primaryProviderName: String?,
    val lastSyncedAt: Long
)

@Dao
interface VulnerabilityDao {
    @Query("SELECT * FROM cached_vulnerabilities WHERE (:status IS NULL OR status = :status) ORDER BY cvssScore DESC LIMIT :limit OFFSET :offset")
    fun observeVulnerabilities(status: String?, limit: Int, offset: Int): Flow<List<VulnerabilityEntity>>

    @Upsert
    suspend fun upsertAll(items: List<VulnerabilityEntity>)

    @Query("UPDATE cached_vulnerabilities SET status = :newStatus WHERE id = :id")
    suspend fun updateLocalStatus(id: Long, newStatus: String)
}
```

### 2. Offline-First Sync & Optimistic Queuing
- When the device is **online**, `VulnerabilityRepository.refreshPage(page, size)` fetches from `GET /api/v1/vulnerabilities?page={page}&size={size}` and updates Room.
- When the device is **offline**, the UI seamlessly renders the Room cache and displays an explicit, non-intrusive **"Offline Mode — Showing last synced data"** banner.
- When an `ANALYST` or `ADMIN` changes a vulnerability's status (`ABIERTA` $\rightarrow$ `PENDIENTE DE REMEDIACIÓN` $\rightarrow$ `RESUELTA` $\rightarrow$ `CERRADA`) while offline, record a `PendingStatusChangeEntity` in Room and schedule a `WorkManager` `CoroutineWorker` with `NetworkType.CONNECTED` constraint to replay the transition once connectivity returns.

### 3. Secure Session Storage & Role Enforcement
- Never store JWT access/refresh tokens in plain `SharedPreferences`. Use `EncryptedSharedPreferences` (Jetpack Security Crypto) or DataStore with Android Keystore encryption.
- Enforce role-based UI controls matching server RBAC:
  - `VIEWER`: Read-only access to dashboards, CVE details, and ICT Provider cards; status-transition controls are disabled with a clear tooltip/label.
  - `ANALYST`: Can transition vulnerabilities up to `RESUELTA`.
  - `ADMIN`: Full lifecycle control including `CERRADA` and ICT Provider risk updates.

### 4. Mobile Accessibility (WCAG 2.1 AA on Android)
- **Touch Targets**: Every interactive button, chip, or list row action must have `minWidth="48dp"` and `minHeight="48dp"`.
- **Screen Readers (TalkBack)**: Every severity badge and status indicator must include both text + icon and an explicit `contentDescription` (e.g., `"Critical severity, CVSS 9.8, status Open"`).
- **Dynamic Font Scaling**: Use `sp` for all typography and ensure layouts do not clip when system font scale is set to `200%`.
