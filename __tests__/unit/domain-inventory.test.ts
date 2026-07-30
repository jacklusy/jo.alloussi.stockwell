import { Quantity } from '@/features/inventory/domain/value-objects/quantity';
import { availableQuantity } from '@/features/inventory/domain/entities/stock-balance';
import { InsufficientStockError } from '@/features/inventory/domain/errors/insufficient-stock.error';
import { asBalanceId, asLocationId, asProductId, asTenantId, asWarehouseId } from '@/types/ids';

describe('inventory domain', () => {
  it('Quantity rejects non-finite and adds', () => {
    expect(() => Quantity.create(Number.NaN)).toThrow('Quantity must be finite');
    expect(Quantity.create(2).add(Quantity.create(3)).value).toBe(5);
  });

  it('availableQuantity subtracts reserved', () => {
    expect(
      availableQuantity({
        id: asBalanceId('b1'),
        tenantId: asTenantId('t1'),
        warehouseId: asWarehouseId('w1'),
        locationId: asLocationId('l1'),
        productId: asProductId('p1'),
        sku: 'SKU',
        productName: 'Widget',
        locationCode: 'A1',
        onHand: 10,
        reserved: 3,
        version: 1,
        pendingSync: false,
        updatedAt: 1,
      }),
    ).toBe(7);
  });

  it('InsufficientStockError carries a clear message', () => {
    const err = new InsufficientStockError(2, -5);
    expect(err.code).toBe('INSUFFICIENT_STOCK');
    expect(err.message).toContain('negative');
  });
});
