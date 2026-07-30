import { initDatabase } from '@/storage/db/client';
import { loadTokens } from '@/storage/secure/keychain';
import {
  persistWarehouseId,
  readBiometricPreference,
  readPersistedWarehouseId,
} from '@/features/auth/application/use-cases/login.usecase';
import { useSessionStore } from '@/services/auth/session-store';
import { asWarehouseId } from '@/types/ids';
import { logger } from '@/services/logging/logger';
import { container, TOKENS } from '@/core/di';
import type { AuthRepository } from '@/features/auth/domain/repositories/auth.repository';

export type BootstrapResult =
  | { phase: 'unauthenticated' }
  | { phase: 'authenticated' }
  | { phase: 'error'; message: string };

/**
 * Restore session, run migrations, evaluate biometric preference.
 * Migrations run before any repository read.
 */
export async function bootstrapApp(): Promise<BootstrapResult> {
  try {
    await initDatabase();

    const biometricEnabled = readBiometricPreference();
    useSessionStore.getState().setBiometricEnabled(biometricEnabled);

    const tokens = await loadTokens();
    if (!tokens) {
      useSessionStore.getState().setHydrated(true);
      return { phase: 'unauthenticated' };
    }

    const warehouse = readPersistedWarehouseId();
    if (warehouse) {
      useSessionStore.getState().setWarehouseId(asWarehouseId(warehouse));
    }

    // Soft refresh when possible; keep local session if offline.
    try {
      const auth = container.resolve<AuthRepository>(TOKENS.AUTH_REPOSITORY);
      const refreshed = await auth.refresh(tokens.refreshToken);
      if (refreshed.ok) {
        useSessionStore.getState().setSession({
          user: refreshed.value.user,
          tenantId: refreshed.value.tenantId,
          warehouseId: warehouse ? asWarehouseId(warehouse) : null,
        });
      }
    } catch (error) {
      logger.warn('Bootstrap refresh skipped', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }

    useSessionStore.getState().setHydrated(true);
    return { phase: 'authenticated' };
  } catch (error) {
    logger.error('Bootstrap failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return {
      phase: 'error',
      message: error instanceof Error ? error.message : 'Startup failed',
    };
  }
}

export { persistWarehouseId };
