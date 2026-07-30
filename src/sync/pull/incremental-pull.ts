import type { AxiosInstance } from 'axios';
import type { DB } from '@op-engineering/op-sqlite';
import { z } from 'zod';

import { mapBalanceDtoToDomain } from '@/features/inventory/data/mappers/stock-balance.mapper';
import { stockBalanceDtoSchema } from '@/features/inventory/data/dto/stock-balance.dto';
import type { SyncEntity } from '@/sync/types';
import { createStockBalanceRepository } from '@/features/inventory/data/repositories/stock-balance.repository.impl';

const pageSchema = z.object({
  data: z.array(stockBalanceDtoSchema),
  meta: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
  cursor: z.string().optional(),
});

const PAGE_SIZE = 200;
const FULL_SYNC_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type PullDeps = {
  client: AxiosInstance;
  db: DB;
  warehouseId: string;
};

async function readCursor(db: DB, entity: SyncEntity): Promise<string | null> {
  const result = await db.execute(
    `SELECT cursor, last_full_sync_at FROM sync_state WHERE entity = ? LIMIT 1`,
    [entity],
  );
  const row = result.rows[0] as
    | { cursor?: string | null; last_full_sync_at?: number | null }
    | undefined;
  if (!row) {
    return null;
  }
  if (row.last_full_sync_at && Date.now() - row.last_full_sync_at > FULL_SYNC_MAX_AGE_MS) {
    return null;
  }
  return row.cursor ?? null;
}

/**
 * Advance cursor only after the page is committed.
 * A crash mid-page re-fetches the same page.
 */
async function commitCursor(
  db: DB,
  entity: SyncEntity,
  cursor: string,
  isFullSync: boolean,
): Promise<void> {
  const now = Date.now();
  await db.execute(
    `INSERT INTO sync_state (entity, last_pulled_at, cursor, last_full_sync_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entity) DO UPDATE SET
       last_pulled_at = excluded.last_pulled_at,
       cursor = excluded.cursor,
       last_full_sync_at = COALESCE(excluded.last_full_sync_at, sync_state.last_full_sync_at)`,
    [entity, now, cursor, isFullSync ? now : null],
  );
}

export async function pullStockBalances(deps: PullDeps): Promise<{ pages: number }> {
  const { client, db, warehouseId } = deps;
  const repo = createStockBalanceRepository(db);
  let cursor = await readCursor(db, 'stock_balances');
  const isFullSync = cursor === null;
  let page = 1;
  let pages = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await client.get('/inventory/balances', {
      params: {
        warehouseId,
        page,
        limit: PAGE_SIZE,
        ...(cursor ? { updatedSince: cursor } : {}),
      },
    });
    const parsed = pageSchema.parse(data);
    const balances = parsed.data.map(mapBalanceDtoToDomain);
    const upsert = await repo.upsertMany(balances);
    if (!upsert.ok) {
      throw upsert.error;
    }

    // Commit cursor only after successful upsert of this page.
    const nextCursor =
      parsed.cursor ??
      (balances.length > 0
        ? String(Math.max(...balances.map((b) => b.updatedAt)))
        : cursor ?? String(Date.now()));
    await commitCursor(db, 'stock_balances', nextCursor, isFullSync && page === 1);
    cursor = nextCursor;
    pages += 1;

    const totalPages = parsed.meta?.totalPages ?? page;
    hasMore = page < totalPages && balances.length === PAGE_SIZE;
    page += 1;
  }

  return { pages };
}
