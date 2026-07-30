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
import { getRawDatabase } from '@/storage/db/client';
import { networkAdapter } from '@/services/network/netinfo';
import * as keychain from '@/storage/secure/keychain';

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

  target.register(TOKENS.STOCK_BALANCE_REPOSITORY, () =>
    createStockBalanceRepository(getRawDatabase()),
  );
  target.register(TOKENS.WAREHOUSE_REPOSITORY, () =>
    createWarehouseRepository(getRawDatabase()),
  );
}

/** Isolated container for tests — swap fakes without touching the app singleton. */
export function createTestContainer(): Container {
  const testContainer = Container.createEmpty();
  registerDependencies(testContainer);
  return testContainer;
}
