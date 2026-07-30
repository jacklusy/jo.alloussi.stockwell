import type { DB } from '@op-engineering/op-sqlite';

import type { MutationQueue } from '@/sync/queue/mutation-queue';
import type { DeltaBuffer } from '@/sync/realtime/delta-buffer';
import type { StockBalanceDelta } from '@/sync/realtime/types';

export type ApplyStockDeltaDeps = {
  db: DB;
  queue: MutationQueue;
  buffer: DeltaBuffer;
};

/**
 * Apply a live server delta only when the local queue has no outstanding work
 * for that entity. Otherwise buffer until after the next push/pull cycle.
 */
export async function applyOrBufferStockDelta(
  deps: ApplyStockDeltaDeps,
  delta: StockBalanceDelta,
): Promise<'applied' | 'buffered'> {
  if (await deps.queue.hasPendingForEntity(delta.balanceId)) {
    deps.buffer.set(delta);
    return 'buffered';
  }
  await writeDelta(deps.db, delta);
  return 'applied';
}

/** Attempt to apply every buffered delta whose entity is now queue-clear. */
export async function flushBufferedStockDeltas(
  deps: ApplyStockDeltaDeps,
): Promise<number> {
  let applied = 0;
  for (const delta of deps.buffer.entries()) {
    if (await deps.queue.hasPendingForEntity(delta.balanceId)) {
      continue;
    }
    deps.buffer.take(delta.balanceId);
    await writeDelta(deps.db, delta);
    applied += 1;
  }
  return applied;
}

async function writeDelta(db: DB, delta: StockBalanceDelta): Promise<void> {
  await db.execute(
    `UPDATE stock_balances
     SET on_hand = ?, reserved = ?, version = ?, pending_sync = 0, updated_at = ?
     WHERE id = ?`,
    [delta.onHand, delta.reserved, delta.version, delta.updatedAt, delta.balanceId],
  );
}
