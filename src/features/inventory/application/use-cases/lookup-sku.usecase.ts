import { Result } from '@/core/domain';
import { NotFoundError, ValidationError, type AppError } from '@/core/errors';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import type { WarehouseId } from '@/types/ids';

export type LookupSkuUseCase = {
  execute: (input: {
    warehouseId: WarehouseId;
    sku: string;
  }) => Promise<Result<StockBalance, AppError>>;
};

export function createLookupSkuUseCase(balances: StockBalanceRepository): LookupSkuUseCase {
  return {
    async execute({ warehouseId, sku }) {
      const trimmed = sku.trim();
      if (!trimmed) {
        return Result.err(new ValidationError('SKU is required'));
      }
      const result = await balances.getBySku(warehouseId, trimmed);
      if (!result.ok) {
        return result;
      }
      if (!result.value) {
        return Result.err(new NotFoundError(`Unknown SKU: ${trimmed}`));
      }
      return Result.ok(result.value);
    },
  };
}
