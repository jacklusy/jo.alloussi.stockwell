import type { DB } from '@op-engineering/op-sqlite';

import { Result } from '@/core/domain';
import { ServerError, type AppError } from '@/core/errors';
import type {
  Warehouse,
  WarehouseRepository,
} from '@/features/warehouses/domain/warehouse.repository';
import { asWarehouseId } from '@/types/ids';

export function createWarehouseRepository(raw: DB): WarehouseRepository {
  return {
    async list(): Promise<Result<Warehouse[], AppError>> {
      try {
        const result = await raw.execute(
          'SELECT id, name, code FROM warehouses ORDER BY name ASC',
        );
        const items = (result.rows as Array<{ id: string; name: string; code: string }>).map(
          (row) => ({
            id: asWarehouseId(row.id),
            name: row.name,
            code: row.code,
          }),
        );
        return Result.ok(items);
      } catch (error) {
        return Result.err(
          new ServerError(error instanceof Error ? error.message : 'List warehouses failed'),
        );
      }
    },
  };
}
