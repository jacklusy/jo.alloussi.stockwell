# ADR-M002: Sync engine lives at `src/sync/`

## Status
Accepted

## Context
Sync serves every feature that mutates or caches remote state. Burying it under `features/inventory` inverts dependency direction.

## Decision
`src/sync/` is a top-level infrastructure module. Features depend on it through application ports, never the reverse.

## Consequences
Clear ownership of the mutation queue, pull, and conflict strategies. Matches the project's portfolio argument.
