# ADR-M004: Single-flight token refresh mutex

## Status

Accepted

## Context

With refresh-token rotation, concurrent 401 responses that each trigger a refresh invalidate all but one token and log the user out spuriously.

## Decision

`RefreshCoordinator` holds at most one in-flight refresh promise. All waiting requests await that same promise, then retry once with the new access token.

## Consequences

Five concurrent 401s produce exactly one refresh call (verified by test). Worth the small amount of coordinator code.
