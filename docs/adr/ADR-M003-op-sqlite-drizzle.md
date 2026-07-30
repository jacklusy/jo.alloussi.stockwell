# ADR-M003: op-sqlite + Drizzle over WatermelonDB

## Status
Accepted

## Context
The mobile project's argument is a hand-built offline sync engine. WatermelonDB provides much of that out of the box, which weakens the demonstration. We also want the local schema to mirror Project 1's Postgres tables closely.

## Decision
Use `@op-engineering/op-sqlite` + `drizzle-orm` with explicit SQL migrations. The mutation queue table must survive every migration.

## Consequences
Full control over sync semantics. More code to own. Documented honestly if SQLCipher is unavailable on a platform.
