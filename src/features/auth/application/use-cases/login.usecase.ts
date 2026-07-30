import { Result } from '@/core/domain';
import type { AppError } from '@/core/errors';
import { OfflineError } from '@/core/errors';
import type {
  AuthCredentials,
  AuthRepository,
  AuthSession,
} from '@/features/auth/domain/repositories/auth.repository';
import { networkAdapter } from '@/services/network/netinfo';
import { saveTokens } from '@/storage/secure/keychain';
import { useSessionStore } from '@/services/auth/session-store';
import { kvStorage } from '@/storage/kv/mmkv';

const BIOMETRIC_KEY = 'auth.biometricEnabled';
const WAREHOUSE_KEY = 'session.warehouseId';

export type LoginUseCase = {
  execute: (credentials: AuthCredentials) => Promise<Result<AuthSession, AppError>>;
};

export function createLoginUseCase(authRepository: AuthRepository): LoginUseCase {
  return {
    async execute(credentials) {
      const online = await networkAdapter.isOnline();
      if (!online) {
        return Result.err(new OfflineError('You need a connection to sign in the first time'));
      }

      const result = await authRepository.login(credentials);
      if (!result.ok) {
        return result;
      }

      const session = result.value;
      await saveTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });

      useSessionStore.getState().setSession({
        user: session.user,
        tenantId: session.tenantId,
      });

      return Result.ok(session);
    },
  };
}

export function readBiometricPreference(): boolean {
  return kvStorage.getBoolean(BIOMETRIC_KEY) === true;
}

export function writeBiometricPreference(enabled: boolean): void {
  kvStorage.set(BIOMETRIC_KEY, enabled);
  useSessionStore.getState().setBiometricEnabled(enabled);
}

export function readPersistedWarehouseId(): string | undefined {
  return kvStorage.getString(WAREHOUSE_KEY);
}

export function persistWarehouseId(warehouseId: string): void {
  kvStorage.set(WAREHOUSE_KEY, warehouseId);
}
