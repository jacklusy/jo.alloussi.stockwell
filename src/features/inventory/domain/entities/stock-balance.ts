import type { BalanceId, LocationId, ProductId, TenantId, WarehouseId } from '@/types/ids';

export type StockBalance = {
  readonly id: BalanceId;
  readonly tenantId: TenantId;
  readonly warehouseId: WarehouseId;
  readonly locationId: LocationId;
  readonly productId: ProductId;
  readonly sku: string;
  readonly productName: string;
  readonly locationCode: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly version: number;
  readonly pendingSync: boolean;
  readonly updatedAt: number;
};

export function availableQuantity(balance: StockBalance): number {
  return balance.onHand - balance.reserved;
}
