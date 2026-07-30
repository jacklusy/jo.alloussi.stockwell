# Performance targets (skill file 2 §4) — M-27

| Metric                       | Target           | Fail               | Status                                                                           |
| ---------------------------- | ---------------- | ------------------ | -------------------------------------------------------------------------------- |
| Cold start → interactive     | < 2.0 s          | > 2.5 s            | **Unverified on device**                                                         |
| Warm start                   | < 800 ms         | > 1.2 s            | **Unverified on device**                                                         |
| Screen transition            | < 300 ms         | > 500 ms           | **Unverified on device**                                                         |
| List scroll, 2,000 rows      | ≥ 58 fps         | < 50 fps           | **Unverified on device**                                                         |
| Animation frame rate         | 60 fps sustained | any sustained drop | Reanimated worklets used for indicator spin / banner; **device confirm pending** |
| Local paginated query        | < 50 ms          | > 120 ms           | SQL-side filter/sort; **device confirm pending**                                 |
| API list load (good network) | < 800 ms         | > 2 s              | Depends on backend                                                               |
| Full sync, 5,000 records     | < 15 s           | > 30 s             | Batch 20 push + 200/page pull; **device confirm pending**                        |
| Release AAB size             | < 30 MB          | > 45 MB            | Measure on first signed release                                                  |
| Idle memory                  | < 180 MB         | > 250 MB           | **Unverified on device**                                                         |

## Why gaps are documented

Profiling requires a mid-range physical Android (~4 GB RAM). This machine/environment could not complete a reliable device profile pass during EPIC 4. Targets remain the acceptance bar; results will be attached to the PR that claims them (Hermes profiler / systrace).

## Engineering choices already aligned with targets

- Hermes + New Architecture on
- `enableFreeze()` / react-native-screens
- FlashList for inventory
- Filtering/sorting in SQLite, not JS
- Sync yields between queue items
- Search debounced 300 ms
