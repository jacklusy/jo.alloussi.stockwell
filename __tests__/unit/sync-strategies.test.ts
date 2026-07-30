import { computeBackoffMs, shouldDeadLetter, MAX_ATTEMPTS, BACKOFF_CAP_MS } from '@/sync/engine/backoff';
import {
  manualStrategy,
  lastWriteWinsStrategy,
  serverWinsStrategy,
  strategyForMutation,
} from '@/sync/conflict/strategies';
import type { QueueItem } from '@/sync/types';

const sampleItem: QueueItem = {
  id: 'q1',
  idempotencyKey: 'k1',
  type: 'ADJUST_STOCK',
  payload: '{"balanceId":"b1","delta":5,"reason":"x"}',
  entityId: 'b1',
  baseVersion: 1,
  status: 'CONFLICT',
  attempts: 0,
  nextAttemptAt: null,
  lastError: null,
  createdAt: 1,
};

describe('Backoff (M-19)', () => {
  it('caps at 5 minutes and dead-letters after max attempts', () => {
    const now = 1_000_000;
    const delay = computeBackoffMs(20, now);
    expect(delay - now).toBeLessThanOrEqual(BACKOFF_CAP_MS);
    expect(shouldDeadLetter(MAX_ATTEMPTS)).toBe(true);
    expect(shouldDeadLetter(MAX_ATTEMPTS - 1)).toBe(false);
  });
});

describe('Conflict strategies (M-21)', () => {
  it('uses Manual for stock adjustments', () => {
    expect(strategyForMutation('ADJUST_STOCK').name).toBe('manual');
    expect(
      manualStrategy.resolve({
        item: sampleItem,
        serverState: { version: 9, onHand: 10 },
      }).action,
    ).toBe('manualRequired');
  });

  it('LastWriteWins retries on new base (available but unused for stock)', () => {
    const decision = lastWriteWinsStrategy.resolve({
      item: sampleItem,
      serverState: { version: 9 },
    });
    expect(decision).toEqual({ action: 'retryWithNewBase', newBaseVersion: 9 });
  });

  it('ServerWins accepts server', () => {
    expect(serverWinsStrategy.resolve({ item: sampleItem, serverState: { version: 2 } })).toEqual({
      action: 'acceptServer',
    });
  });

  it('maps TRANSFER_STOCK to manual and unknown types to serverWins', () => {
    expect(strategyForMutation('TRANSFER_STOCK').name).toBe('manual');
    expect(strategyForMutation('UNKNOWN').name).toBe('serverWins');
  });
});
