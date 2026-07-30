# ADR-M008: Background sync (best-effort)

## Status
Accepted

## Context
Doc 15 §9 deferred background sync. Android Doze and iOS BGTaskScheduler make “always sync in background” a lie; the queue already survives process death. The missing piece is a **trigger**, not more queue semantics.

## Decision
1. **Shared JS entry:** `runBackgroundSync(engine)` — boot + `engine.run('background')`.
2. **Android:** register Headless JS task `StockwellBackgroundSync` and a `HeadlessJsTaskService` stub. **Periodic WorkManager scheduling is optional** and must be enabled deliberately (battery); document it rather than enabling by default on every install.
3. **iOS:** no BGTaskScheduler wiring in MVP (see ADR-M006). The same JS entry can be called from a future BGTask.
4. Foreground triggers (app active, connectivity, 5‑minute interval) remain the primary path.

## Consequences
- Reviewers see a real Headless task name and service, not a fake always-on sync claim.
- Operators still drive sync while the app is open; background runs are opportunistic.
- Enabling PeriodicWork requires a follow-up PR that adds `work-runtime` and a policy decision on interval + network constraints.
