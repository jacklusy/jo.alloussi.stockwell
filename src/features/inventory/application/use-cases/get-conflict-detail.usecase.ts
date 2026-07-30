import { Result } from '@/core/domain';
import { NotFoundError, type AppError } from '@/core/errors';
import { ConflictStore } from '@/sync/conflict/conflict-store';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { adjustStockPayloadSchema } from '@/sync/types';

export type ConflictDetail = {
  readonly queueItemId: string;
  readonly localSummary: string;
  readonly serverSummary: string;
  readonly serverOnHand: number | null;
  readonly serverVersion: number | null;
};

export type GetConflictDetailUseCase = {
  execute: (queueItemId: string) => Promise<Result<ConflictDetail, AppError>>;
};

export function createGetConflictDetailUseCase(deps: {
  queue: MutationQueue;
  conflicts: ConflictStore;
}): GetConflictDetailUseCase {
  return {
    async execute(queueItemId) {
      const item = await deps.queue.getById(queueItemId);
      if (!item) {
        return Result.err(new NotFoundError('Queue item not found'));
      }
      const rows = await deps.conflicts.list();
      const conflict = rows.find((r) => r.queueItemId === queueItemId);
      if (!conflict) {
        return Result.err(new NotFoundError('Conflict record not found'));
      }

      let localSummary = String(item.type);
      if (item.type === 'ADJUST_STOCK') {
        try {
          const payload = adjustStockPayloadSchema.parse(JSON.parse(item.payload));
          const sign = payload.delta > 0 ? '+' : '';
          localSummary = `${sign}${payload.delta} · ${payload.reason}`;
        } catch {
          localSummary = 'Local adjustment';
        }
      }

      let serverOnHand: number | null = null;
      let serverVersion: number | null = null;
      let serverSummary = 'Server state unavailable';
      try {
        const server = JSON.parse(conflict.serverState) as {
          version?: number;
          on_hand?: number;
          onHand?: number;
        };
        serverVersion =
          typeof server.version === 'number' ? server.version : null;
        const onHand = server.on_hand ?? server.onHand;
        serverOnHand = typeof onHand === 'number' ? onHand : null;
        serverSummary = `version ${serverVersion ?? '?'}${
          serverOnHand !== null ? ` · on hand ${serverOnHand}` : ''
        }`;
      } catch {
        // keep defaults
      }

      return Result.ok({
        queueItemId,
        localSummary,
        serverSummary,
        serverOnHand,
        serverVersion,
      });
    },
  };
}
