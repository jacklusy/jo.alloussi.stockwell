import { createLookupSkuUseCase } from '@/features/inventory/application/use-cases/lookup-sku.usecase';
import { Result } from '@/core/domain';
import type { StockBalanceRepository } from '@/features/inventory/domain/repositories/stock-balance.repository';
import { asBalanceId, asLocationId, asProductId, asTenantId, asWarehouseId } from '@/types/ids';
import {
  checkCameraPermission,
  requestCameraPermission,
} from '@/services/permissions/camera';
import { check, request, RESULTS } from 'react-native-permissions';

const balance = {
  id: asBalanceId('b1'),
  tenantId: asTenantId('t1'),
  warehouseId: asWarehouseId('w1'),
  locationId: asLocationId('l1'),
  productId: asProductId('p1'),
  sku: 'ABC-123',
  productName: 'Bolt',
  locationCode: 'B-02',
  onHand: 5,
  reserved: 0,
  version: 1,
  pendingSync: false,
  updatedAt: 1,
};

describe('Barcode / SKU lookup (M-24)', () => {
  it('manual entry finds known SKU', async () => {
    const repo: StockBalanceRepository = {
      list: async () => Result.ok({ items: [], total: 0, page: 1, limit: 50 }),
      getById: async () => Result.ok(balance),
      getBySku: async () => Result.ok(balance),
      upsertMany: async () => Result.ok(undefined),
      applyOptimisticDelta: async () => Result.ok(balance),
      applyAuthoritative: async () => Result.ok(undefined),
    };
    const useCase = createLookupSkuUseCase(repo);
    const result = await useCase.execute({
      warehouseId: asWarehouseId('w1'),
      sku: 'abc-123',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sku).toBe('ABC-123');
    }
  });

  it('unknown SKU returns NotFound', async () => {
    const repo: StockBalanceRepository = {
      list: async () => Result.ok({ items: [], total: 0, page: 1, limit: 50 }),
      getById: async () => Result.ok(null),
      getBySku: async () => Result.ok(null),
      upsertMany: async () => Result.ok(undefined),
      applyOptimisticDelta: async () => Result.ok(balance),
      applyAuthoritative: async () => Result.ok(undefined),
    };
    const useCase = createLookupSkuUseCase(repo);
    const result = await useCase.execute({
      warehouseId: asWarehouseId('w1'),
      sku: 'NOPE',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('permission granted path', async () => {
    (check as jest.Mock).mockResolvedValueOnce(RESULTS.GRANTED);
    await expect(checkCameraPermission()).resolves.toBe('granted');
  });

  it('permission denied then blocked → PermissionDenied path', async () => {
    (check as jest.Mock).mockResolvedValueOnce(RESULTS.DENIED);
    (request as jest.Mock).mockResolvedValueOnce(RESULTS.BLOCKED);
    await expect(requestCameraPermission()).resolves.toBe('blocked');
  });
});
