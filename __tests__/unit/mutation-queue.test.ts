import { MutationQueue } from '@/sync/queue/mutation-queue';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

describe('MutationQueue', () => {
  it('lists by status, updates base version, and resets in-flight', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const a = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'b1',
      baseVersion: 1,
      idempotencyKey: 'fixed-key',
    });
    expect(a.idempotencyKey).toBe('fixed-key');

    await queue.markInFlight(a.id);
    expect(await queue.resetInFlight()).toBe(1);
    const pending = await queue.listByStatus(['PENDING']);
    expect(pending).toHaveLength(1);

    await queue.updateBaseVersion(a.id, 7);
    const updated = await queue.getById(a.id);
    expect(updated?.baseVersion).toBe(7);
    expect(updated?.status).toBe('PENDING');

    expect(await queue.listByStatus([])).toEqual([]);
    expect(await queue.hasPendingForEntity('b1')).toBe(true);
    await queue.markPending(a.id);
    await queue.markFailed(a.id, 2, Date.now() + 10_000, 'wait');
    expect((await queue.getById(a.id))?.status).toBe('FAILED');
    await queue.markDead(a.id, 'gone');
    expect(await queue.hasPendingForEntity('b1')).toBe(false);
  });
});
