# Architecture — Stockwell Mobile

Layered clean architecture for an offline-first React Native warehouse client.

See skill file 1 and ADRs in `docs/adr/`.

## Layers

Presentation → Application → Domain ← Data / Infrastructure

`sync/` is top-level infrastructure (ADR-M002). `ui/` is domain-agnostic.
