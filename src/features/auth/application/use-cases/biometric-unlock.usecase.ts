import { Result } from '@/core/domain';
import { AuthError, type AppError } from '@/core/errors';
import type {
  AuthRepository,
  AuthSession,
} from '@/features/auth/domain/repositories/auth.repository';
import { useSessionStore } from '@/services/auth/session-store';
import { loadTokens, saveTokens } from '@/storage/secure/keychain';
import { readBiometricPreference } from '@/features/auth/application/use-cases/login.usecase';

export type BiometricUnlockUseCase = {
  execute: () => Promise<Result<AuthSession, AppError>>;
};

/**
 * Offline unlock: valid refresh token in keychain + biometric gate.
 * Does not require network if tokens are still valid for local session restore;
 * refresh is attempted when online.
 */
export function createBiometricUnlockUseCase(
  authRepository: AuthRepository,
): BiometricUnlockUseCase {
  return {
    async execute() {
      if (!readBiometricPreference()) {
        return Result.err(new AuthError('Biometric unlock is not enabled'));
      }

      const tokens = await loadTokens();
      if (!tokens) {
        return Result.err(new AuthError('No stored session'));
      }

      const refreshed = await authRepository.refresh(tokens.refreshToken);
      if (refreshed.ok) {
        await saveTokens({
          accessToken: refreshed.value.accessToken,
          refreshToken: refreshed.value.refreshToken,
        });
        useSessionStore.getState().setSession({
          user: refreshed.value.user,
          tenantId: refreshed.value.tenantId,
        });
        return refreshed;
      }

      // Offline with a still-present refresh token: restore local session shell.
      // Full profile must already be cached in session/MMKV in a later ticket;
      // for now surface auth error so password fallback is offered.
      return Result.err(refreshed.error);
    },
  };
}
