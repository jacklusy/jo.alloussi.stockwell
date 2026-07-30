import type { AxiosInstance } from 'axios';
import type { DB } from '@op-engineering/op-sqlite';

import { logger } from '@/services/logging/logger';
import { refreshCoordinator } from '@/services/auth/refresh-coordinator';
import { networkAdapter } from '@/services/network/netinfo';
import { useSyncStatusStore } from '@/services/auth/sync-status-store';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { pushQueueItem } from '@/sync/queue/push-item';
import { ConflictStore } from '@/sync/conflict/conflict-store';
import * as conflictStrategies from '@/sync/conflict/strategies';
import { computeBackoffMs, shouldDeadLetter } from '@/sync/engine/backoff';
import { pullStockBalances } from '@/sync/pull/incremental-pull';
import { flushBufferedStockDeltas } from '@/sync/realtime/apply-stock-delta';
import { realtimeDeltaBuffer } from '@/sync/realtime/delta-buffer';
import type { SyncEngineState } from '@/sync/types';

const PUSH_BATCH = 20;

export type SyncEngineDeps = {
  db: DB;
  client: AxiosInstance;
  getWarehouseId: () => string | null;
  /** Optional — flush buffered WebSocket deltas after push/pull. */
  afterCycle?: () => Promise<void>;
};

/**
 * Offline sync state machine.
 * Order is non-negotiable: PUSH before PULL.
 */
export class SyncEngine {
  private state: SyncEngineState = 'IDLE';
  private readonly queue: MutationQueue;
  private readonly conflicts: ConflictStore;
  private running: Promise<void> | null = null;

  /** Observability for tests — records phase order. */
  readonly phaseLog: SyncEngineState[] = [];

  constructor(private readonly deps: SyncEngineDeps) {
    this.queue = new MutationQueue(deps.db);
    this.conflicts = new ConflictStore(deps.db);
  }

  getState(): SyncEngineState {
    return this.state;
  }

  async boot(): Promise<void> {
    const reset = await this.queue.resetInFlight();
    if (reset > 0) {
      logger.info('Reset IN_FLIGHT queue items to PENDING', { count: reset });
    }
  }

  /** Single-flight sync cycle. */
  async run(reason = 'manual'): Promise<void> {
    if (this.running) {
      return this.running;
    }
    this.running = this.cycle(reason).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private setState(next: SyncEngineState): void {
    this.state = next;
    this.phaseLog.push(next);
    this.publishStatus();
  }

  private async publishStatus(): Promise<void> {
    const counts = await this.queue.countByStatus();
    const pending = counts.PENDING + counts.IN_FLIGHT + counts.FAILED;
    const conflicts = counts.CONFLICT;
    const failed = counts.DEAD + counts.FAILED;
    const setStatus = useSyncStatusStore.getState().setStatus;

    if (this.state === 'PUSHING' || this.state === 'PULLING') {
      setStatus({ kind: 'syncing' });
      return;
    }
    if (conflicts > 0) {
      setStatus({ kind: 'conflict', count: conflicts });
      return;
    }
    if (failed > 0 && pending === 0) {
      setStatus({ kind: 'failed', count: failed });
      return;
    }
    if (pending > 0) {
      setStatus({ kind: 'pending', count: pending });
      return;
    }
    setStatus({ kind: 'synced' });
  }

  private async cycle(reason: string): Promise<void> {
    logger.info('Sync cycle start', { reason });
    const online = await networkAdapter.isOnline();
    if (!online) {
      this.setState('OFFLINE');
      await this.publishStatus();
      return;
    }

    try {
      // PUSH BEFORE PULL — non-negotiable
      this.setState('PUSHING');
      const pushOk = await this.pushBatch();
      if (!pushOk || this.state === 'ERROR') {
        return;
      }

      this.setState('PULLING');
      const warehouseId = this.deps.getWarehouseId();
      if (warehouseId) {
        await pullStockBalances({
          client: this.deps.client,
          db: this.deps.db,
          warehouseId,
        });
      }

      const counts = await this.queue.countByStatus();
      if (counts.CONFLICT > 0) {
        this.setState('RESOLVING');
      } else {
        this.setState('IDLE');
      }
    } catch (error) {
      logger.error('Sync cycle failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      this.setState('ERROR');
    } finally {
      try {
        if (this.deps.afterCycle) {
          await this.deps.afterCycle();
        } else {
          await flushBufferedStockDeltas({
            db: this.deps.db,
            queue: this.queue,
            buffer: realtimeDeltaBuffer,
          });
        }
      } catch (error) {
        logger.warn('afterCycle flush failed', {
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
      await this.publishStatus();
    }
  }

  /** @returns false when the cycle must abort (e.g. refresh failed). */
  private async pushBatch(): Promise<boolean> {
    for (let i = 0; i < PUSH_BATCH; i += 1) {
      const item = await this.queue.dequeueNext();
      if (!item) {
        return true;
      }

      await this.queue.markInFlight(item.id);
      const result = await pushQueueItem(this.deps.client, item);

      switch (result.kind) {
        case 'ok':
          await this.applyAuthoritativeBalance(item.entityId, result.serverVersion);
          await this.queue.delete(item.id);
          await this.conflicts.remove(item.id);
          break;
        case 'conflict': {
          await this.queue.markConflict(item.id, 'Version conflict');
          await this.conflicts.record(item.id, item.payload, result.serverState);
          const strategy = conflictStrategies.strategyForMutation(item.type);
          const decision = strategy.resolve({
            item,
            serverState: result.serverState as { version: number },
          });
          if (decision.action === 'acceptServer') {
            await this.queue.delete(item.id);
            await this.conflicts.remove(item.id);
          }
          // manualRequired / others: leave in CONFLICT for sync centre
          break;
        }
        case 'dead':
          await this.queue.markDead(item.id, result.error);
          // Dead items are never silently discarded — they surface in sync centre.
          logger.error('Queue item dead-lettered', {
            id: item.id,
            error: result.error,
          });
          break;
        case 'auth':
          await this.queue.markPending(item.id);
          try {
            await refreshCoordinator.refresh();
          } catch {
            this.setState('ERROR');
            return false;
          }
          // Resume: continue loop so remaining items push after refresh
          break;
        case 'retry': {
          const attempts = item.attempts + 1;
          if (shouldDeadLetter(attempts)) {
            await this.queue.markDead(item.id, result.error);
            logger.error('Queue item dead-lettered after max attempts', {
              id: item.id,
            });
            break;
          }
          const nextAt =
            result.retryAfterMs !== undefined
              ? Date.now() + result.retryAfterMs
              : computeBackoffMs(attempts);
          await this.queue.markFailed(item.id, attempts, nextAt, result.error);
          break;
        }
        default: {
          const _exhaustive: never = result;
          return _exhaustive;
        }
      }

      // Yield between items so the JS thread stays responsive
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    return true;
  }

  private async applyAuthoritativeBalance(
    balanceId: string,
    serverVersion: number,
  ): Promise<void> {
    await this.deps.db.execute(
      `UPDATE stock_balances
       SET version = ?, pending_sync = 0, updated_at = ?
       WHERE id = ?`,
      [serverVersion, Date.now(), balanceId],
    );
  }
}
