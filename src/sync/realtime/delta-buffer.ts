import type { StockBalanceDelta } from '@/sync/realtime/types';

/**
 * In-memory hold for live deltas that arrived while the entity had pending queue work.
 * Flushed after a sync cycle when the queue no longer references the entity.
 */
export class DeltaBuffer {
  private readonly byEntity = new Map<string, StockBalanceDelta>();

  set(delta: StockBalanceDelta): void {
    this.byEntity.set(delta.balanceId, delta);
  }

  take(entityId: string): StockBalanceDelta | undefined {
    const delta = this.byEntity.get(entityId);
    if (delta) {
      this.byEntity.delete(entityId);
    }
    return delta;
  }

  entries(): StockBalanceDelta[] {
    return [...this.byEntity.values()];
  }

  clear(): void {
    this.byEntity.clear();
  }

  get size(): number {
    return this.byEntity.size;
  }
}

/** Process-wide buffer — SyncEngine flush + socket share one instance. */
export const realtimeDeltaBuffer = new DeltaBuffer();
