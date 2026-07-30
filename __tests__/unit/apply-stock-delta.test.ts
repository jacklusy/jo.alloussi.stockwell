import { MutationQueue } from '@/sync/queue/mutation-queue';
import { DeltaBuffer } from '@/sync/realtime/delta-buffer';
import {
  applyOrBufferStockDelta,
  flushBufferedStockDeltas,
} from '@/sync/realtime/apply-stock-delta';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

async function seedBalance(db: ReturnType<typeof createSyncMemoryDb>, id = 'b1') {
  await db.execute(
    `INSERT INTO stock_balances (id, tenant_id, warehouse_id, location_id, product_id, on_hand, reserved, version, pending_sync, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, 't1', 'wh1', 'loc1', 'p1', 10, 0, 1, 0, 1],
  );
}

describe('applyOrBufferStockDelta (ADR-M007)', () => {
  it('applies when the entity has no pending queue work', async () => {
    const db = createSyncMemoryDb();
    await seedBalance(db);
    const queue = new MutationQueue(db);
    const buffer = new DeltaBuffer();

    const result = await applyOrBufferStockDelta(
      { db, queue, buffer },
      { balanceId: 'b1', onHand: 42, reserved: 1, version: 3, updatedAt: 99 },
    );

    expect(result).toBe('applied');
    expect(buffer.size).toBe(0);
    const row = (
      await db.execute(`SELECT * FROM stock_balances WHERE id = ?`, ['b1'])
    ).rows[0] as { on_hand: number; version: number };
    expect(row.on_hand).toBe(42);
    expect(row.version).toBe(3);
  });

  it('buffers when the entity has pending mutations', async () => {
    const db = createSyncMemoryDb();
    await seedBalance(db);
    const queue = new MutationQueue(db);
    await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'b1',
      baseVersion: 1,
    });
    const buffer = new DeltaBuffer();

    const result = await applyOrBufferStockDelta(
      { db, queue, buffer },
      { balanceId: 'b1', onHand: 99, reserved: 0, version: 9, updatedAt: 1 },
    );

    expect(result).toBe('buffered');
    expect(buffer.size).toBe(1);
    const row = (
      await db.execute(`SELECT * FROM stock_balances WHERE id = ?`, ['b1'])
    ).rows[0] as { on_hand: number };
    expect(row.on_hand).toBe(10);
  });

  it('flushes buffered deltas after the queue clears', async () => {
    const db = createSyncMemoryDb();
    await seedBalance(db);
    const queue = new MutationQueue(db);
    const item = await queue.enqueue({
      type: 'ADJUST_STOCK',
      payload: '{}',
      entityId: 'b1',
      baseVersion: 1,
    });
    const buffer = new DeltaBuffer();
    await applyOrBufferStockDelta(
      { db, queue, buffer },
      { balanceId: 'b1', onHand: 77, reserved: 0, version: 5, updatedAt: 2 },
    );

    expect(await flushBufferedStockDeltas({ db, queue, buffer })).toBe(0);
    await queue.delete(item.id);
    const applied = await flushBufferedStockDeltas({ db, queue, buffer });
    expect(applied).toBe(1);
    expect(buffer.size).toBe(0);
    buffer.clear();
    const row = (
      await db.execute(`SELECT * FROM stock_balances WHERE id = ?`, ['b1'])
    ).rows[0] as { on_hand: number };
    expect(row.on_hand).toBe(77);
  });
});
