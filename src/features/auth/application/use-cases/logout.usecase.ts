import type { DB } from '@op-engineering/op-sqlite';

import { Result } from '@/core/domain';
import { ValidationError, type AppError } from '@/core/errors';
import type { AuthRepository } from '@/features/auth/domain/repositories/auth.repository';
import { wipeLocalTenantData } from '@/services/auth/logout-wipe';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { networkAdapter } from '@/services/network/netinfo';

export type LogoutUseCase = {
  execute: (input?: {
    confirmQueueDiscard?: boolean;
  }) => Promise<Result<{ discardedQueueItems: number }, AppError>>;
};

export function createLogoutUseCase(deps: {
  auth: AuthRepository;
  db: DB;
  queue: MutationQueue;
}): LogoutUseCase {
  return {
    async execute(input = {}) {
      const counts = await deps.queue.countByStatus();
      const pending =
        counts.PENDING + counts.IN_FLIGHT + counts.FAILED + counts.CONFLICT + counts.DEAD;
      if (pending > 0 && !input.confirmQueueDiscard) {
        return Result.err(
          new ValidationError(
            'Queue not empty',
            'You have unsynced changes. Confirm discard to log out.',
          ),
        );
      }

      const online = await networkAdapter.isOnline();
      if (online) {
        await deps.auth.logout();
      }

      const wiped = await wipeLocalTenantData(deps.db, { wipeQueue: true });
      if (!wiped.ok) {
        return wiped;
      }
      return Result.ok({ discardedQueueItems: pending });
    },
  };
}
