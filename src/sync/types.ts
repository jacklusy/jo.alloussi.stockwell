import { z } from 'zod';

export type SyncEngineState = 'IDLE' | 'PUSHING' | 'PULLING' | 'RESOLVING' | 'ERROR' | 'OFFLINE';

export type QueueItemStatus = 'PENDING' | 'IN_FLIGHT' | 'FAILED' | 'CONFLICT' | 'DEAD';

export type MutationType = 'ADJUST_STOCK' | 'TRANSFER_STOCK';

export const adjustStockPayloadSchema = z.object({
  balanceId: z.string().min(1),
  /** Delta semantics — never absolute quantity. */
  delta: z.number().finite(),
  reason: z.string().min(1),
  note: z.string().optional(),
});

export type AdjustStockPayload = z.infer<typeof adjustStockPayloadSchema>;

export type QueueItem = {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly type: MutationType;
  readonly payload: string;
  readonly entityId: string;
  readonly baseVersion: number;
  readonly status: QueueItemStatus;
  readonly attempts: number;
  readonly nextAttemptAt: number | null;
  readonly lastError: string | null;
  readonly createdAt: number;
};

export type SyncEntity =
  | 'warehouses'
  | 'locations'
  | 'products'
  | 'stock_balances'
  | 'stock_movements';

export type ConflictRecord = {
  queueItemId: string;
  localPayload: string;
  serverState: string;
  detectedAt: number;
  resolution: string | null;
};

export type PushResult =
  | { kind: 'ok'; serverVersion: number }
  | { kind: 'conflict'; serverState: unknown }
  | { kind: 'dead'; error: string }
  | { kind: 'retry'; error: string; retryAfterMs?: number }
  | { kind: 'auth' };

export type ConflictStrategyName = 'serverWins' | 'lastWriteWins' | 'manual';
