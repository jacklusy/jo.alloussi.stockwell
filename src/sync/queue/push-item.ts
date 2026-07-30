import type { AxiosInstance } from 'axios';

import {
  AuthError,
  ConflictError,
  ForbiddenError,
  RateLimitError,
  ValidationError,
} from '@/core/errors';
import {
  adjustStockPayloadSchema,
  type PushResult,
  type QueueItem,
} from '@/sync/types';

/**
 * Push a single queue item. Never regenerates the idempotency key.
 */
export async function pushQueueItem(
  client: AxiosInstance,
  item: QueueItem,
): Promise<PushResult> {
  try {
    if (item.type === 'ADJUST_STOCK') {
      const payload = adjustStockPayloadSchema.parse(JSON.parse(item.payload));
      const { data } = await client.post(
        `/inventory/balances/${payload.balanceId}/adjust`,
        {
          delta: payload.delta,
          reason: payload.reason,
          note: payload.note,
          base_version: item.baseVersion,
        },
        {
          headers: {
            'Idempotency-Key': item.idempotencyKey,
            'If-Match': String(item.baseVersion),
          },
          // @ts-expect-error custom axios config field used by our client
          idempotencyKey: item.idempotencyKey,
        },
      );
      const version =
        typeof data === 'object' && data && 'version' in data
          ? Number((data as { version: number }).version)
          : item.baseVersion + 1;
      return { kind: 'ok', serverVersion: version };
    }

    return { kind: 'dead', error: `Unsupported mutation type: ${item.type}` };
  } catch (error) {
    if (error instanceof ConflictError) {
      return {
        kind: 'conflict',
        serverState: error.serverState ?? { version: item.baseVersion + 1 },
      };
    }
    if (error instanceof AuthError) {
      return { kind: 'auth' };
    }
    if (error instanceof ValidationError) {
      // 400 or 422 mapped to ValidationError — treat as dead (deterministic)
      return { kind: 'dead', error: error.message };
    }
    if (error instanceof ForbiddenError) {
      return { kind: 'dead', error: error.message };
    }
    if (error instanceof RateLimitError) {
      return {
        kind: 'retry',
        error: error.message,
        ...(error.retryAfterMs !== undefined ? { retryAfterMs: error.retryAfterMs } : {}),
      };
    }
    return {
      kind: 'retry',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
