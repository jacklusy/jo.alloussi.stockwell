import { Result } from '@/core/domain';
import { ValidationError } from '@/core/errors';
import { createAdjustStockUseCase } from '@/features/inventory/application/use-cases/adjust-stock.usecase';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import type { SyncEngine } from '@/sync/engine/sync-engine';
import { asBalanceId, asLocationId, asProductId, asTenantId, asWarehouseId } from '@/types/ids';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: jest.fn(async () => false),
  },
}));

function balance(overrides: Partial<StockBalance> = {}): StockBalance {
  return {
    id: asBalanceId('bal-1'),
    tenantId: asTenantId('t1'),
    warehouseId: asWarehouseId('w1'),
    locationId: asLocationId('l1'),
    productId: asProductId('p1'),
    sku: 'SKU-1',
    productName: 'Widget',
    locationCode: 'A-01',
    onHand: 10,
    reserved: 0,
    version: 7,
    pendingSync: false,
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('AdjustStockUseCase (M-20)', () => {
  it('rejects negative result locally before queueing', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    let current = balance({ onHand: 2 });
    const balances: StockBalanceRepository = {
      list: async () => Result.ok({ items: [], total: 0, page: 1, limit: 50 }),
      getById: async () => Result.ok(current),
      upsertMany: async () => Result.ok(undefined),
      applyOptimisticDelta: async () =>
        Result.err(new ValidationError('should not run')),
      applyAuthoritative: async () => Result.ok(undefined),
    };
    const syncEngine = { run: jest.fn() } as unknown as SyncEngine;
    const useCase = createAdjustStockUseCase({ balances, queue, syncEngine });

    const result = await useCase.execute({
      balanceId: asBalanceId('bal-1'),
      delta: -5,
      reason: 'damage',
    });
    expect(result.ok).toBe(false);
    const pending = await queue.dequeueNext();
    expect(pending).toBeNull();
  });

  it('optimistically updates and enqueues delta offline in under 100ms', async () => {
    const db = createSyncMemoryDb();
    const queue = new MutationQueue(db);
    let current = balance({ onHand: 10, version: 7 });
    const balances: StockBalanceRepository = {
      list: async () => Result.ok({ items: [], total: 0, page: 1, limit: 50 }),
      getById: async () => Result.ok(current),
      upsertMany: async () => Result.ok(undefined),
      applyOptimisticDelta: async (_id, delta) => {
        current = {
          ...current,
          onHand: current.onHand + delta,
          pendingSync: true,
        };
        return Result.ok(current);
      },
      applyAuthoritative: async () => Result.ok(undefined),
    };
    const syncEngine = { run: jest.fn() } as unknown as SyncEngine;
    const useCase = createAdjustStockUseCase({ balances, queue, syncEngine });

    const started = Date.now();
    const result = await useCase.execute({
      balanceId: asBalanceId('bal-1'),
      delta: 50,
      reason: 'recount',
    });
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.onHand).toBe(60);
      expect(result.value.pendingSync).toBe(true);
    }
    expect(elapsed).toBeLessThan(100);

    const item = await queue.dequeueNext();
    expect(item).not.toBeNull();
    expect(item?.baseVersion).toBe(7);
    const payload = JSON.parse(item?.payload ?? '{}') as { delta: number };
    expect(payload.delta).toBe(50);
    expect(syncEngine.run).not.toHaveBeenCalled(); // offline
  });
});
