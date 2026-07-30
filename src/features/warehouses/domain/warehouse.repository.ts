import type { Result } from '@/core/domain';
import type { AppError } from '@/core/errors';
import type { WarehouseId } from '@/types/ids';

export type Warehouse = {
  id: WarehouseId;
  name: string;
  code: string;
};

export type WarehouseRepository = {
  list: () => Promise<Result<Warehouse[], AppError>>;
};
