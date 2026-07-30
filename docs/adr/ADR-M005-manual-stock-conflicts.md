# ADR-M005: Manual conflict resolution for stock

## Status

Accepted

## Context

Stock quantity conflicts mean two operators counted the same bin. Automatically choosing server or client silently erases one count and creates inventory blame.

## Decision

Use the Strategy pattern with three strategies (`ServerWins`, `LastWriteWins`, `Manual`). Stock adjustments (`ADJUST_STOCK`, `TRANSFER_STOCK`) always select **Manual**. Queue payloads store **deltas**, not absolute quantities, so "retry on new base" remains safe.

## Consequences

Operators resolve conflicts in a dedicated modal (retry / discard / manual quantity). LastWriteWins remains available for non-stock entities but is never used for quantities.
