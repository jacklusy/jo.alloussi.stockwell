import type { ConflictStrategyName, QueueItem } from '@/sync/types';

export type ConflictDecision =
  | { action: 'acceptServer' }
  | { action: 'retryWithNewBase'; newBaseVersion: number }
  | { action: 'discardLocal' }
  | { action: 'manualRequired' };

export type ConflictContext = {
  item: QueueItem;
  serverState: { version: number; onHand?: number; [key: string]: unknown };
};

export type ConflictStrategy = {
  readonly name: ConflictStrategyName;
  resolve: (ctx: ConflictContext) => ConflictDecision;
};

/** Reference data — discard local, accept server. */
export const serverWinsStrategy: ConflictStrategy = {
  name: 'serverWins',
  resolve: () => ({ action: 'acceptServer' }),
};

/**
 * Available but unused for stock — silent data loss.
 * Kept for the Strategy pattern demo and non-stock entities.
 */
export const lastWriteWinsStrategy: ConflictStrategy = {
  name: 'lastWriteWins',
  resolve: (ctx) => ({
    action: 'retryWithNewBase',
    newBaseVersion: ctx.serverState.version,
  }),
};

/** Stock adjustments — surface both values; operator decides. */
export const manualStrategy: ConflictStrategy = {
  name: 'manual',
  resolve: () => ({ action: 'manualRequired' }),
};

export function strategyForMutation(type: string): ConflictStrategy {
  switch (type) {
    case 'ADJUST_STOCK':
      return manualStrategy;
    case 'TRANSFER_STOCK':
      return manualStrategy;
    default:
      return serverWinsStrategy;
  }
}
