/**
 * DI registration — called once at bootstrap.
 */
import { Container, container, TOKENS } from '@/core/di';
import { logger } from '@/services/logging/logger';
import { apiClient } from '@/services/api/client';
import { refreshCoordinator } from '@/services/auth/refresh-coordinator';
import { createAuthRepository } from '@/features/auth/data/repositories/auth.repository.impl';
import { createLoginUseCase } from '@/features/auth/application/use-cases/login.usecase';
import { createBiometricUnlockUseCase } from '@/features/auth/application/use-cases/biometric-unlock.usecase';
import { createStockBalanceRepository } from '@/features/inventory/data/repositories/stock-balance.repository.impl';
import { createWarehouseRepository } from '@/features/warehouses/data/warehouse.repository.impl';
import { createAdjustStockUseCase } from '@/features/inventory/application/use-cases/adjust-stock.usecase';
import { createResolveConflictUseCase } from '@/features/inventory/application/use-cases/resolve-conflict.usecase';
import { createGetConflictDetailUseCase } from '@/features/inventory/application/use-cases/get-conflict-detail.usecase';
import { createSyncCentreUseCase } from '@/features/inventory/application/use-cases/sync-centre.usecase';
import { createLookupSkuUseCase } from '@/features/inventory/application/use-cases/lookup-sku.usecase';
import { createLogoutUseCase } from '@/features/auth/application/use-cases/logout.usecase';
import { getRawDatabase } from '@/storage/db/client';
import { networkAdapter } from '@/services/network/netinfo';
import * as keychain from '@/storage/secure/keychain';
import { MutationQueue } from '@/sync/queue/mutation-queue';
import { ConflictStore } from '@/sync/conflict/conflict-store';
import { SyncEngine } from '@/sync/engine/sync-engine';
import { useSessionStore } from '@/services/auth/session-store';

export function registerDependencies(target: Container = container): void {
  target.registerInstance(TOKENS.LOGGER, logger);
  target.registerInstance(TOKENS.HTTP_CLIENT, apiClient);
  target.registerInstance(TOKENS.NETWORK, networkAdapter);
  target.registerInstance(TOKENS.KEYCHAIN, keychain);

  const authRepo = createAuthRepository(apiClient);
  target.registerInstance(TOKENS.AUTH_REPOSITORY, authRepo);
  target.registerInstance(TOKENS.LOGIN_USE_CASE, createLoginUseCase(authRepo));
  target.registerInstance(
    TOKENS.BIOMETRIC_UNLOCK_USE_CASE,
    createBiometricUnlockUseCase(authRepo),
  );

  refreshCoordinator.configure(async (refreshToken) => {
    const result = await authRepo.refresh(refreshToken);
    if (!result.ok) {
      throw result.error;
    }
    return {
      accessToken: result.value.accessToken,
      refreshToken: result.value.refreshToken,
    };
  });

  target.register(TOKENS.DATABASE, () => getRawDatabase());
  target.register(TOKENS.STOCK_BALANCE_REPOSITORY, () =>
    createStockBalanceRepository(getRawDatabase()),
  );
  target.register(TOKENS.WAREHOUSE_REPOSITORY, () =>
    createWarehouseRepository(getRawDatabase()),
  );

  target.register(TOKENS.MUTATION_QUEUE, () => new MutationQueue(getRawDatabase()));
  target.register(
    TOKENS.SYNC_ENGINE,
    () =>
      new SyncEngine({
        db: getRawDatabase(),
        client: apiClient,
        getWarehouseId: () => useSessionStore.getState().warehouseId,
      }),
  );

  target.register(TOKENS.ADJUST_STOCK_USE_CASE, () =>
    createAdjustStockUseCase({
      balances: target.resolve(TOKENS.STOCK_BALANCE_REPOSITORY),
      queue: target.resolve(TOKENS.MUTATION_QUEUE),
      syncEngine: target.resolve(TOKENS.SYNC_ENGINE),
    }),
  );

  target.register(TOKENS.LOOKUP_SKU_USE_CASE, () =>
    createLookupSkuUseCase(target.resolve(TOKENS.STOCK_BALANCE_REPOSITORY)),
  );

  target.register(TOKENS.LOGOUT_USE_CASE, () =>
    createLogoutUseCase({
      auth: authRepo,
      db: getRawDatabase(),
      queue: target.resolve(TOKENS.MUTATION_QUEUE),
    }),
  );

  target.register(TOKENS.RESOLVE_CONFLICT_USE_CASE, () =>
    createResolveConflictUseCase({
      queue: target.resolve(TOKENS.MUTATION_QUEUE),
      conflicts: new ConflictStore(getRawDatabase()),
      balances: target.resolve(TOKENS.STOCK_BALANCE_REPOSITORY),
      syncEngine: target.resolve(TOKENS.SYNC_ENGINE),
    }),
  );

  target.register(TOKENS.GET_CONFLICT_DETAIL_USE_CASE, () =>
    createGetConflictDetailUseCase({
      queue: target.resolve(TOKENS.MUTATION_QUEUE),
      conflicts: new ConflictStore(getRawDatabase()),
    }),
  );

  target.register(TOKENS.SYNC_CENTRE_USE_CASE, () =>
    createSyncCentreUseCase({
      queue: target.resolve(TOKENS.MUTATION_QUEUE),
      syncEngine: target.resolve(TOKENS.SYNC_ENGINE),
    }),
  );
}

/** Isolated container for tests — swap fakes without touching the app singleton. */
export function createTestContainer(): Container {
  const testContainer = Container.createEmpty();
  registerDependencies(testContainer);
  return testContainer;
}
