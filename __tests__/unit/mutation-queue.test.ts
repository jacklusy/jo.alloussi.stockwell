import { MutationQueue } from '@/sync/queue/mutation-queue';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

describe('MutationQueue (M-17)', () => {
  it('enqueues FIFO and preserves order on dequeue', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);

    const a = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'a' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    // Ensure distinct created_at for FIFO assertion
    await new Promise((r) => setTimeout(r, 2));
    const b = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b2', delta: 2, reason: 'b' }),
      entityId: 'b2',
      baseVersion: 1,
    });

    const first = await queue.dequeueNext();
    expect(first?.id).toBe(a.id);
    await queue.markInFlight(a.id);
    await queue.delete(a.id);

    const second = await queue.dequeueNext();
    expect(second?.id).toBe(b.id);
  });

  it('generates idempotency key once and keeps it stable', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 5, reason: 'count' }),
      entityId: 'b1',
      baseVersion: 3,
      idempotencyKey: 'fixed-key-1',
    });
    expect(item.idempotencyKey).toBe('fixed-key-1');

    await queue.markFailed(item.id, 1, Date.now() + 1000, 'network');
    const again = await queue.getById(item.id);
    expect(again?.idempotencyKey).toBe('fixed-key-1');
  });

  it('survives restart — IN_FLIGHT resets to PENDING', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: JSON.stringify({ balanceId: 'b1', delta: 1, reason: 'x' }),
      entityId: 'b1',
      baseVersion: 1,
    });
    await queue.markInFlight(item.id);

    // Simulate app restart with same DB
    const restarted = new MutationQueue(db);
    const reset = await restarted.resetInFlight();
    expect(reset).toBe(1);
    const pending = await restarted.dequeueNext();
    expect(pending?.id).toBe(item.id);
    expect(pending?.idempotencyKey).toBe(item.idempotencyKey);
    expect(pending?.status).toBe('PENDING');
  });
});
