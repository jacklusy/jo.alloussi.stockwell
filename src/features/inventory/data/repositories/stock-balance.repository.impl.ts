import type { DB } from '@op-engineering/op-sqlite';

import { Result } from '@/core/domain';
import { NotFoundError, ServerError, ValidationError, type AppError } from '@/core/errors';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import {
  mapBalanceDomainToRow,
  mapBalanceRowToDomain,
  type StockBalanceRow,
} from '@/features/inventory/data/mappers/stock-balance.mapper';
import type { BalanceId, WarehouseId } from '@/types/ids';

const BALANCE_SELECT = `SELECT
  b.id, b.tenant_id, b.warehouse_id, b.location_id, b.product_id,
  p.sku, p.name AS product_name, l.code AS location_code,
  b.on_hand, b.reserved, b.version, b.pending_sync, b.updated_at
FROM stock_balances b
JOIN products p ON p.id = b.product_id
JOIN locations l ON l.id = b.location_id`;

/**
 * Local-first repository. Filtering/sorting happen in SQL.
 */
export function createStockBalanceRepository(raw: DB): StockBalanceRepository {
  async function getById(id: BalanceId): Promise<Result<StockBalance | null, AppError>> {
    try {
      const result = await raw.execute(
        `${BALANCE_SELECT}
         WHERE b.id = ?
         LIMIT 1`,
        [id],
      );
      const row = result.rows[0] as StockBalanceRow | undefined;
      return Result.ok(row ? mapBalanceRowToDomain(row) : null);
    } catch (error) {
      return Result.err(
        new ServerError(error instanceof Error ? error.message : 'Get balance failed'),
      );
    }
  }

  return {
    list: async (query) => {
      try {
        const limit = Math.min(query.limit, 100);
        const offset = (query.page - 1) * limit;
        const params: Array<string | number> = [query.warehouseId];
        const where: string[] = ['b.warehouse_id = ?'];

        if (query.search && query.search.trim().length > 0) {
          where.push('(p.sku LIKE ? OR p.name LIKE ? OR l.code LIKE ?)');
          const term = `%${query.search.trim()}%`;
          params.push(term, term, term);
        }
        if (query.lowStockOnly) {
          where.push('(b.on_hand - b.reserved) <= 0');
        }
        if (query.hasReserved) {
          where.push('b.reserved > 0');
        }

        const whereSql = where.join(' AND ');
        const countResult = await raw.execute(
          `SELECT COUNT(*) AS total
           FROM stock_balances b
           JOIN products p ON p.id = b.product_id
           JOIN locations l ON l.id = b.location_id
           WHERE ${whereSql}`,
          params,
        );
        const total = Number(
          (countResult.rows[0] as { total?: number } | undefined)?.total ?? 0,
        );

        const listParams = [...params, limit, offset];
        const listResult = await raw.execute(
          `${BALANCE_SELECT}
           WHERE ${whereSql}
           ORDER BY p.sku ASC
           LIMIT ? OFFSET ?`,
          listParams,
        );

        const items = (listResult.rows as StockBalanceRow[]).map(mapBalanceRowToDomain);
        return Result.ok({ items, total, page: query.page, limit });
      } catch (error) {
        return Result.err(
          new ServerError(error instanceof Error ? error.message : 'List balances failed'),
        );
      }
    },

    getById,

    async getBySku(warehouseId: WarehouseId, sku: string) {
      try {
        const normalised = sku.trim().toUpperCase();
        if (!normalised) {
          return Result.ok(null);
        }
        const result = await raw.execute(
          `${BALANCE_SELECT}
           WHERE b.warehouse_id = ? AND UPPER(p.sku) = ?
           LIMIT 1`,
          [warehouseId, normalised],
        );
        const row = result.rows[0] as StockBalanceRow | undefined;
        return Result.ok(row ? mapBalanceRowToDomain(row) : null);
      } catch (error) {
        return Result.err(
          new ServerError(error instanceof Error ? error.message : 'SKU lookup failed'),
        );
      }
    },

    async applyOptimisticDelta(id, delta) {
      try {
        const existing = await getById(id);
        if (!existing.ok) {
          return existing;
        }
        if (!existing.value) {
          return Result.err(new NotFoundError('Balance not found'));
        }
        const nextOnHand = existing.value.onHand + delta;
        if (nextOnHand < 0) {
          return Result.err(
            new ValidationError(
              `Adjustment ${delta} would make on-hand negative`,
              'Cannot reduce stock below zero',
            ),
          );
        }
        await raw.execute(
          `UPDATE stock_balances
           SET on_hand = ?, pending_sync = 1, updated_at = ?
           WHERE id = ?`,
          [nextOnHand, Date.now(), id],
        );
        const updated = await getById(id);
        if (!updated.ok || !updated.value) {
          return Result.err(new ServerError('Optimistic update failed'));
        }
        return Result.ok(updated.value);
      } catch (error) {
        return Result.err(
          new ServerError(
            error instanceof Error ? error.message : 'Optimistic update failed',
          ),
        );
      }
    },

    async applyAuthoritative(id, onHand, version) {
      try {
        await raw.execute(
          `UPDATE stock_balances
           SET on_hand = ?, version = ?, pending_sync = 0, updated_at = ?
           WHERE id = ?`,
          [onHand, version, Date.now(), id],
        );
        return Result.ok(undefined);
      } catch (error) {
        return Result.err(
          new ServerError(
            error instanceof Error ? error.message : 'Authoritative update failed',
          ),
        );
      }
    },

    async upsertMany(balances) {
      try {
        for (const balance of balances) {
          const row = mapBalanceDomainToRow(balance);
          await raw.execute(
            `INSERT INTO stock_balances (
               id, tenant_id, warehouse_id, location_id, product_id,
               on_hand, reserved, version, pending_sync, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               on_hand = excluded.on_hand,
               reserved = excluded.reserved,
               version = excluded.version,
               pending_sync = excluded.pending_sync,
               updated_at = excluded.updated_at`,
            [
              row.id,
              row.tenant_id,
              row.warehouse_id,
              row.location_id,
              row.product_id,
              row.on_hand,
              row.reserved,
              row.version,
              row.pending_sync,
              row.updated_at,
            ],
          );
          await raw.execute(
            `INSERT INTO products (id, tenant_id, sku, name, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               sku = excluded.sku,
               name = excluded.name,
               updated_at = excluded.updated_at`,
            [
              balance.productId,
              balance.tenantId,
              balance.sku,
              balance.productName,
              balance.updatedAt,
            ],
          );
          await raw.execute(
            `INSERT INTO locations (id, tenant_id, warehouse_id, code, name, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               code = excluded.code,
               name = excluded.name,
               updated_at = excluded.updated_at`,
            [
              balance.locationId,
              balance.tenantId,
              balance.warehouseId,
              balance.locationCode,
              balance.locationCode,
              balance.updatedAt,
            ],
          );
        }
        return Result.ok(undefined);
      } catch (error) {
        return Result.err(
          new ServerError(error instanceof Error ? error.message : 'Upsert balances failed'),
        );
      }
    },
  };
}
