# ADR-M001: Deliberate asymmetry in feature layering

## Status
Accepted

## Context
Uniform clean architecture on every feature creates ceremony without payoff for read-only or preference-only surfaces.

## Decision
- `warehouses`: one repository, one hook — no use case, no value objects
- `settings`: Zustand + MMKV — no domain layer
- `inventory`: full layering (invariants + concurrency)

## Consequences
Reviewers see judgement. Epic 2 implements warehouses/settings shortcuts; inventory gets the full treatment.
