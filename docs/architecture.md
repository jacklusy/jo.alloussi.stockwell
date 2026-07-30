# Architecture — Stockwell Mobile

Layered clean architecture for an offline-first React Native warehouse client.

Authoritative rules: skill file 1 (layers / DI) · skill file 2 (TS / RN) · skill file 4 (packages / CI).

## Layers

```
Presentation → Application → Domain ← Data / Infrastructure
```

| Layer | May import | Must not import |
|---|---|---|
| Domain | Pure TS only | React, RN, axios, DB |
| Application | Domain | React / RN (prefer) |
| Presentation | Application, Domain types, `ui/` | `data/`, `storage/`, `sync/` |
| `sync/` | Domain, infrastructure | Presentation |

`sync/` is top-level (ADR-M002). `ui/` is domain-agnostic.

## Feature asymmetry (ADR-M001)

- **inventory** — full layering (invariants + concurrency)
- **warehouses** — repository + hook only
- **settings** — Zustand + MMKV

## Key runtime paths

1. **Read:** SQLite → screen (network updates DB in background)
2. **Write:** use case → optimistic DB + enqueue → sync engine push → pull
3. **Auth:** Keychain tokens · single-flight refresh (ADR-M004)
4. **Crash:** Sentry adapter · PII scrubbed in `beforeSend`

## Diagrams

Offline mutation sequence lives in the root README (Mermaid).  
Folder layout and ADR index: `docs/adr/`.
