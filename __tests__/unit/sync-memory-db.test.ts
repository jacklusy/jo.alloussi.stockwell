import { MutationQueue } from '@/sync/queue/mutation-queue';
import { wipeLocalTenantData } from '@/services/auth/logout-wipe';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

describe('sync memory db helpers', () => {
  it('deletes a queue row by id', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'e1',
      baseVersion: 1,
    });
    await queue.delete(item.id);
    expect(await queue.getById(item.id)).toBeNull();
  });

  it('wipes entire mutation_queue', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'e1',
      baseVersion: 1,
    });
    const wipe = await wipeLocalTenantData(db, { wipeQueue: true });
    expect(wipe.ok).toBe(true);
    expect(await queue.dequeueNext()).toBeNull();
  });
});
