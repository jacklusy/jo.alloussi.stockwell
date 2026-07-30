import type { StockBalance } from '@/features/inventory/domain/entities/stock-balance';
import type { StockBalanceDto } from '@/features/inventory/data/dto/stock-balance.dto';
import { asBalanceId, asLocationId, asProductId, asTenantId, asWarehouseId } from '@/types/ids';

export type StockBalanceRow = {
  id: string;
  tenant_id: string;
  warehouse_id: string;
  location_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  location_code: string;
  on_hand: number;
  reserved: number;
  version: number;
  pending_sync: number | boolean;
  updated_at: number;
};

function toEpoch(value: string | number): number {
  return typeof value === 'number' ? value : Date.parse(value);
}

export function mapBalanceDtoToDomain(dto: StockBalanceDto): StockBalance {
  return {
    id: asBalanceId(dto.id),
    tenantId: asTenantId(dto.tenant_id),
    warehouseId: asWarehouseId(dto.warehouse_id),
    locationId: asLocationId(dto.location_id),
    productId: asProductId(dto.product_id),
    sku: dto.sku,
    productName: dto.product_name,
    locationCode: dto.location_code,
    onHand: dto.on_hand,
    reserved: dto.reserved,
    version: dto.version,
    pendingSync: false,
    updatedAt: toEpoch(dto.updated_at),
  };
}

export function mapBalanceRowToDomain(row: StockBalanceRow): StockBalance {
  return {
    id: asBalanceId(row.id),
    tenantId: asTenantId(row.tenant_id),
    warehouseId: asWarehouseId(row.warehouse_id),
    locationId: asLocationId(row.location_id),
    productId: asProductId(row.product_id),
    sku: row.sku,
    productName: row.product_name,
    locationCode: row.location_code,
    onHand: row.on_hand,
    reserved: row.reserved,
    version: row.version,
    pendingSync: Boolean(row.pending_sync),
    updatedAt: row.updated_at,
  };
}

export function mapBalanceDomainToRow(balance: StockBalance): StockBalanceRow {
  return {
    id: balance.id,
    tenant_id: balance.tenantId,
    warehouse_id: balance.warehouseId,
    location_id: balance.locationId,
    product_id: balance.productId,
    sku: balance.sku,
    product_name: balance.productName,
    location_code: balance.locationCode,
    on_hand: balance.onHand,
    reserved: balance.reserved,
    version: balance.version,
    pending_sync: balance.pendingSync ? 1 : 0,
    updated_at: balance.updatedAt,
  };
}
