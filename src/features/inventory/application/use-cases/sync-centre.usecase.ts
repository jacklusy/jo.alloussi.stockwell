import type { MutationQueue } from '@/sync/queue/mutation-queue';
import type { QueueItem, QueueItemStatus } from '@/sync/types';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { adjustStockPayloadSchema } from '@/sync/types';
import { Result } from '@/core/domain';
import { NotFoundError, ValidationError, type AppError } from '@/core/errors';

export type SyncCentreSection = 'PENDING' | 'FAILED' | 'CONFLICT' | 'DEAD';

export type SyncCentreItem = {
  readonly id: string;
  readonly section: SyncCentreSection;
  readonly type: string;
  readonly summary: string;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly createdAt: number;
  readonly entityId: string;
};

function sectionFor(status: QueueItemStatus): SyncCentreSection | null {
  switch (status) {
    case 'PENDING':
    case 'IN_FLIGHT':
      return 'PENDING';
    case 'FAILED':
      return 'FAILED';
    case 'CONFLICT':
      return 'CONFLICT';
    case 'DEAD':
      return 'DEAD';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function summarise(item: QueueItem): string {
  if (item.type === 'ADJUST_STOCK') {
    try {
      const payload = adjustStockPayloadSchema.parse(JSON.parse(item.payload));
      const sign = payload.delta > 0 ? '+' : '';
      return `${sign}${payload.delta} · ${payload.reason}`;
    } catch {
      return 'Adjust stock';
    }
  }
  return item.type;
}

export type SyncCentreUseCase = {
  list: () => Promise<SyncCentreItem[]>;
  retry: (id: string) => Promise<Result<void, AppError>>;
  discard: (id: string) => Promise<Result<void, AppError>>;
};

export function createSyncCentreUseCase(deps: {
  queue: MutationQueue;
  syncEngine: SyncEngine;
}): SyncCentreUseCase {
  return {
    async list() {
      const items = await deps.queue.listByStatus([
        'PENDING',
        'IN_FLIGHT',
        'FAILED',
        'CONFLICT',
        'DEAD',
      ]);
      const mapped: SyncCentreItem[] = [];
      for (const item of items) {
        const section = sectionFor(item.status);
        if (!section) {
          continue;
        }
        mapped.push({
          id: item.id,
          section,
          type: item.type,
          summary: summarise(item),
          attempts: item.attempts,
          lastError: item.lastError,
          createdAt: item.createdAt,
          entityId: item.entityId,
        });
      }
      return mapped;
    },

    async retry(id) {
      const item = await deps.queue.getById(id);
      if (!item) {
        return Result.err(new NotFoundError('Queue item not found'));
      }
      if (item.status !== 'FAILED' && item.status !== 'DEAD') {
        return Result.err(new ValidationError('Only failed or dead items can be retried'));
      }
      await deps.queue.markPending(id);
      void deps.syncEngine.run('manual-retry');
      return Result.ok(undefined);
    },

    async discard(id) {
      const item = await deps.queue.getById(id);
      if (!item) {
        return Result.err(new NotFoundError('Queue item not found'));
      }
      await deps.queue.delete(id);
      return Result.ok(undefined);
    },
  };
}
