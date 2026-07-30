import type { Result } from '@/core/domain';
import type { AppError } from '@/core/errors';
import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { BalanceId, WarehouseId } from '@/types/ids';

export type ListBalancesQuery = {
  warehouseId: WarehouseId;
  search?: string;
  page: number;
  limit: number;
  lowStockOnly?: boolean;
  hasReserved?: boolean;
};

export type PaginatedBalances = {
  items: StockBalance[];
  total: number;
  page: number;
  limit: number;
};

export type StockBalanceRepository = {
  list: (query: ListBalancesQuery) => Promise<Result<PaginatedBalances, AppError>>;
  getById: (id: BalanceId) => Promise<Result<StockBalance | null, AppError>>;
  upsertMany: (balances: StockBalance[]) => Promise<Result<void, AppError>>;
};
