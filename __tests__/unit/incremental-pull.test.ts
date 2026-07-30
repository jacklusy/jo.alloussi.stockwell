import type { AxiosInstance } from 'axios';

import { Result } from '@/core/domain';
import { ServerError } from '@/core/errors';
import { pullStockBalances } from '@/sync/pull/incremental-pull';
import { createSyncMemoryDb } from '../helpers/sync-memory-db';

const mockUpsertMany = jest.fn(async () => Result.ok(undefined));

jest.mock('@/features/inventory/data/repositories/stock-balance.repository.impl', () => ({
  createStockBalanceRepository: () => ({ upsertMany: mockUpsertMany }),
}));

describe('pullStockBalances', () => {
  beforeEach(() => {
    mockUpsertMany.mockClear();
    mockUpsertMany.mockResolvedValue(Result.ok(undefined));
  });

  it('pages until complete and commits cursor', async () => {
    const db = createSyncMemoryDb();
    const client = {
      get: jest.fn(async () => ({
        data: {
          data: [
            {
              id: 'b1',
              tenant_id: 't1',
              warehouse_id: 'wh1',
              location_id: 'l1',
              product_id: 'p1',
              sku: 'SKU',
              product_name: 'Widget',
              location_code: 'A1',
              on_hand: 1,
              reserved: 0,
              version: 1,
              updated_at: '2020-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 200, total: 1, totalPages: 1 },
          cursor: 'cursor-1',
        },
      })),
    };

    const result = await pullStockBalances({
      client: client as unknown as AxiosInstance,
      db,
      warehouseId: 'wh1',
    });
    expect(result.pages).toBe(1);
    expect(mockUpsertMany).toHaveBeenCalled();
  });

  it('forces full sync when last_full_sync_at is stale', async () => {
    const db = createSyncMemoryDb();
    const weekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    await db.execute(
      `INSERT INTO sync_state (entity, last_pulled_at, cursor, last_full_sync_at) VALUES (?, ?, ?, ?)`,
      ['stock_balances', weekAgo, 'old-cursor', weekAgo],
    );
    const client = {
      get: jest.fn(async (_url: string, cfg: { params: { updatedSince?: string } }) => {
        expect(cfg.params.updatedSince).toBeUndefined();
        return {
          data: { data: [], meta: { page: 1, limit: 200, total: 0, totalPages: 1 } },
        };
      }),
    };
    await pullStockBalances({
      client: client as unknown as AxiosInstance,
      db,
      warehouseId: 'wh1',
    });
  });

  it('throws when upsert fails', async () => {
    mockUpsertMany.mockImplementation(
      async () => Result.err(new ServerError('db')) as never,
    );
    const db = createSyncMemoryDb();
    const client = {
      get: jest.fn(async () => ({
        data: {
          data: [
            {
              id: 'b1',
              tenant_id: 't1',
              warehouse_id: 'wh1',
              location_id: 'l1',
              product_id: 'p1',
              sku: 'SKU',
              product_name: 'Widget',
              location_code: 'A1',
              on_hand: 1,
              reserved: 0,
              version: 1,
              updated_at: '2020-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 200, total: 1, totalPages: 1 },
        },
      })),
    };
    await expect(
      pullStockBalances({
        client: client as unknown as AxiosInstance,
        db,
        warehouseId: 'wh1',
      }),
    ).rejects.toBeInstanceOf(ServerError);
  });
});
