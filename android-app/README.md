# Android Mobile Client - VulnFollowUp

Mobile client for Android providing on-call security engineers and IT managers with real-time access to critical alerts, vulnerability status tracking, and offline consultation.

---

## Technical Scope & DAM Modules

- **Programación Multimedia y Dispositivos Móviles (PMDM)**:
  - **Local Persistence & Offline First**: Local cache using Room (SQLite abstraction) or structured offline database to allow consulting assets and open vulnerabilities without active network access.
  - **Network Synchronization**: Background sync using `WorkManager` or asynchronous Coroutines to push status updates and reconcile with the REST API.
  - **Mobile UX/UI**: Clean Material Design 3 guidelines, dark mode support, pull-to-refresh, and adaptive layouts for phone and tablet form factors.
  - **Security**: Secure storage of authentication tokens via Android Keystore / EncryptedSharedPreferences.

---

## Architecture Structure

```
android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/vulnfollowup/mobile/
│   │   │   │   ├── data/
│   │   │   │   │   ├── local/      # Room database, DAOs, Entity models
│   │   │   │   │   ├── remote/     # Retrofit / OkHttp API clients & DTOs
│   │   │   │   │   └── repository/ # Single source of truth (Network + Cache)
│   │   │   │   ├── ui/
│   │   │   │   │   ├── dashboard/  # Summary dashboard and KPI cards
│   │   │   │   │   ├── list/       # Vulnerability RecyclerView / LazyColumn
│   │   │   │   │   └── detail/     # Vulnerability assessment and triage view
│   │   │   │   └── util/           # Network monitoring, converters, formatters
│   │   │   ├── res/                # Layouts, drawables, strings, color themes
│   │   │   └── AndroidManifest.xml
│   └── build.gradle
└── build.gradle
```

---

## Target Features

- Dashboard displaying high and critical severity alerts.
- Filterable list of vulnerabilities cached locally.
- Detail view showing CVSS score, vector breakdown, affected assets, and ICT vendor.
- Status quick-actions for authorized roles (`ANALYST`, `ADMIN`).
