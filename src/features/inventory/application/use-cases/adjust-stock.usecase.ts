import { Result } from '@/core/domain';
import { NotFoundError, ValidationError, type AppError } from '@/core/errors';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { networkAdapter } from '@/services/network/netinfo';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import {
  adjustStockPayloadSchema,
  type AdjustStockPayload,
} from '@/sync/types';
import type { BalanceId } from '@/types/ids';

export type AdjustStockInput = {
  balanceId: BalanceId;
  delta: number;
  reason: string;
  note?: string;
};

export type AdjustStockUseCase = {
  execute: (input: AdjustStockInput) => Promise<Result<StockBalance, AppError>>;
};

export type AdjustStockDeps = {
  balances: StockBalanceRepository;
  queue: MutationQueue;
  syncEngine: SyncEngine;
};

/**
 * Optimistic local write + enqueue. Never waits on the network.
 * Target: <100 ms offline path.
 */
export function createAdjustStockUseCase(deps: AdjustStockDeps): AdjustStockUseCase {
  return {
    async execute(input) {
      if (!Number.isFinite(input.delta) || input.delta === 0) {
        return Result.err(new ValidationError('Delta must be a non-zero number'));
      }

      const payloadParse = adjustStockPayloadSchema.safeParse({
        balanceId: input.balanceId,
        delta: input.delta,
        reason: input.reason,
        ...(input.note !== undefined ? { note: input.note } : {}),
      } satisfies AdjustStockPayload);
      if (!payloadParse.success) {
        return Result.err(new ValidationError(payloadParse.error.message));
      }

      const existing = await deps.balances.getById(input.balanceId);
      if (!existing.ok) {
        return existing;
      }
      if (!existing.value) {
        return Result.err(new NotFoundError('Balance not found'));
      }

      // Reject negative result locally before queueing.
      if (existing.value.onHand + input.delta < 0) {
        return Result.err(
          new ValidationError(
            `Adjustment ${input.delta} would make on-hand negative`,
            'Cannot reduce stock below zero',
          ),
        );
      }

      const optimistic = await deps.balances.applyOptimisticDelta(
        input.balanceId,
        input.delta,
      );
      if (!optimistic.ok) {
        return optimistic;
      }

      await deps.queue.enqueue({
        type: 'ADJUST_STOCK',
        payload: JSON.stringify(payloadParse.data),
        entityId: input.balanceId,
        baseVersion: existing.value.version,
      });

      // Fire-and-forget sync when online — do not await for UX.
      void networkAdapter.isOnline().then((online) => {
        if (online) {
          void deps.syncEngine.run('after-enqueue');
        }
      });

      return Result.ok(optimistic.value);
    },
  };
}
