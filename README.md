# Stockwell Mobile

Offline-first React Native client for the Stockwell multi-tenant inventory API.

**Target user:** warehouse operators (gloves, glare, dead zones) — not dashboard viewers.

**Application ID:** `jo.alloussi.stockwell`

## Status

- EPIC 1 — Foundation & design system ✅
- EPIC 2 — Auth, API & data layer ✅
- EPIC 3 — Offline engine ✅
- EPIC 4 — Native, proof & polish ✅ (device performance / TalkBack still pending — see [docs/performance.md](docs/performance.md) and [docs/accessibility.md](docs/accessibility.md))
- EPIC 5 — Ship (Sentry, Play, README polish) pending

## Stack

React Native CLI 0.86 · New Architecture · TypeScript strict · TanStack Query · Zustand · op-sqlite + Drizzle · Axios + Zod · Reanimated · FlashList · vision-camera

## Offline-sync evidence (M-25)

```bash
npm run test:offline-sync
```

```
PASS __tests__/integration/offline-sync.suite.test.ts
  Offline-sync mandatory suite (M-25)
    √ 1. Offline mutation → queued → reconnect → synced → exactly one server movement
    √ 2. Idempotent replay — double push of same item → one server movement
    √ 3. Conflict — 409 → CONFLICT → retry on new base applies
    √ 4. Interrupted sync — IN_FLIGHT reset → resume, nothing duplicated
    √ 5. Logout wipe — local tenant data and keychain cleared

Test Suites: 1 passed
Tests:       5 passed
```

## Scripts

```bash
npm start
npm run android
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run test:offline-sync
npm run api:types
npm run contrast
npm run deps:cruise
```

## Docs

- [Design system](docs/design-system.md)
- [Architecture](docs/architecture.md)
- [Performance](docs/performance.md)
- [Accessibility](docs/accessibility.md)
- [ADRs](docs/adr/)
- [Play closed track](docs/play-closed-track.md)
