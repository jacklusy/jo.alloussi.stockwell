# ADR-M007: WebSocket stock deltas (optional, feature-flagged)

## Status

Accepted

## Context

Doc 15 §9 deferred live deltas so the MVP sync story stayed queue-first and reviewable. Reviewers still expect a considered design — and a small, testable client proves the queue-safety rule without depending on a production socket server.

## Decision

Ship a **feature-flagged** `StockDeltaSocket` behind `WS_URL` (empty = off):

1. Authenticate with the access token on connect (`?access_token=`).
2. Handle `stock.balance.updated` only.
3. **Apply** the delta iff the mutation queue has no `PENDING` / `IN_FLIGHT` / `FAILED` / `CONFLICT` row for that entity; otherwise **buffer**.
4. After every sync cycle, flush the buffer for entities that are now clear.
5. On reconnect, trigger an incremental pull (`engine.run('ws-reconnect')`) rather than trusting missed events.
6. Reconnect with the same exponential backoff used by the push queue.

No new native dependency — platform `WebSocket` only.

## Consequences

- Production stays HTTP-only until the API exposes a socket and `WS_URL` is set.
- Live deltas never overwrite unpushed local work.
- Push notifications remain deferred (separate channel).
