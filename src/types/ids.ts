export type TenantId = string & { readonly __brand: 'TenantId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type WarehouseId = string & { readonly __brand: 'WarehouseId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
export type LocationId = string & { readonly __brand: 'LocationId' };
export type BalanceId = string & { readonly __brand: 'BalanceId' };

export function asTenantId(value: string): TenantId {
  return value as TenantId;
}
export function asUserId(value: string): UserId {
  return value as UserId;
}
export function asWarehouseId(value: string): WarehouseId {
  return value as WarehouseId;
}
export function asProductId(value: string): ProductId {
  return value as ProductId;
}
export function asLocationId(value: string): LocationId {
  return value as LocationId;
}
export function asBalanceId(value: string): BalanceId {
  return value as BalanceId;
}
