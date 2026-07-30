import { Result } from '@/core/domain';
import { NotFoundError, ValidationError, type AppError } from '@/core/errors';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { ConflictStore } from '@/sync/conflict/conflict-store';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { adjustStockPayloadSchema } from '@/sync/types';
import type { BalanceId } from '@/types/ids';

export type ConflictResolutionAction =
  | { kind: 'retryOnNewBase' }
  | { kind: 'discardLocal' }
  | { kind: 'setManualQuantity'; onHand: number };

export type ResolveConflictUseCase = {
  execute: (
    queueItemId: string,
    action: ConflictResolutionAction,
  ) => Promise<Result<void, AppError>>;
};

type ServerConflictState = {
  version: number;
  onHand: number | null;
};

function parseServerState(raw: string): ServerConflictState {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid server state');
  }
  const record = parsed as Record<string, unknown>;
  const version = Number(record.version);
  if (!Number.isFinite(version)) {
    throw new Error('Missing server version');
  }
  const onHandRaw = record.on_hand ?? record.onHand;
  const onHand = typeof onHandRaw === 'number' && Number.isFinite(onHandRaw) ? onHandRaw : null;
  return { version, onHand };
}

export function createResolveConflictUseCase(deps: {
  queue: MutationQueue;
  conflicts: ConflictStore;
  balances: StockBalanceRepository;
  syncEngine: SyncEngine;
}): ResolveConflictUseCase {
  return {
    async execute(queueItemId, action) {
      const item = await deps.queue.getById(queueItemId);
      if (!item) {
        return Result.err(new NotFoundError('Queue item not found'));
      }
      if (item.status !== 'CONFLICT') {
        return Result.err(new ValidationError('Item is not in conflict'));
      }

      const conflictRows = await deps.conflicts.list();
      const conflict = conflictRows.find((c) => c.queueItemId === queueItemId);
      if (!conflict) {
        return Result.err(new NotFoundError('Conflict record not found'));
      }

      let serverState: ServerConflictState;
      try {
        serverState = parseServerState(conflict.serverState);
      } catch {
        return Result.err(new ValidationError('Corrupt conflict server state'));
      }

      const balanceId = item.entityId as BalanceId;

      switch (action.kind) {
        case 'retryOnNewBase': {
          // Payload stores a delta — safe to re-apply on the new base.
          await deps.queue.updateBaseVersion(queueItemId, serverState.version);
          await deps.conflicts.resolve(queueItemId, 'retryOnNewBase');
          await deps.conflicts.remove(queueItemId);
          void deps.syncEngine.run('conflict-retry');
          return Result.ok(undefined);
        }
        case 'discardLocal': {
          if (serverState.onHand !== null) {
            const applied = await deps.balances.applyAuthoritative(
              balanceId,
              serverState.onHand,
              serverState.version,
            );
            if (!applied.ok) {
              return applied;
            }
          }
          await deps.queue.delete(queueItemId);
          await deps.conflicts.resolve(queueItemId, 'discardLocal');
          await deps.conflicts.remove(queueItemId);
          return Result.ok(undefined);
        }
        case 'setManualQuantity': {
          if (action.onHand < 0 || !Number.isFinite(action.onHand)) {
            return Result.err(new ValidationError('Quantity must be non-negative'));
          }
          if (serverState.onHand === null) {
            return Result.err(new ValidationError('Server on-hand unknown — cannot compute delta'));
          }
          const previous = adjustStockPayloadSchema.parse(JSON.parse(item.payload));
          const delta = action.onHand - serverState.onHand;
          await deps.queue.delete(queueItemId);
          await deps.conflicts.remove(queueItemId);

          // Local truth becomes the operator's value; enqueue delta from server base.
          const authoritative = await deps.balances.applyAuthoritative(
            balanceId,
            action.onHand,
            serverState.version,
          );
          if (!authoritative.ok) {
            return authoritative;
          }

          if (delta !== 0) {
            await deps.queue.enqueue({
              type: 'ADJUST_STOCK',
              payload: JSON.stringify({
                balanceId: previous.balanceId,
                delta,
                reason: previous.reason,
                ...(previous.note !== undefined ? { note: previous.note } : {}),
              }),
              entityId: item.entityId,
              baseVersion: serverState.version,
            });
            // Mark pending without changing quantity again.
            const pending = await deps.balances.applyOptimisticDelta(balanceId, 0);
            if (!pending.ok) {
              // Zero delta is a no-op path — flag pending via authoritative then re-set.
              // applyOptimisticDelta with 0 keeps onHand; sets pending_sync.
              return pending;
            }
          }
          void deps.syncEngine.run('conflict-manual');
          return Result.ok(undefined);
        }
        default: {
          const _exhaustive: never = action;
          return _exhaustive;
        }
      }
    },
  };
}
