import { Result } from '@/core/domain';
import { AuthError, OfflineError } from '@/core/errors';
import { createLoginUseCase } from '@/features/auth/application/use-cases/login.usecase';
import type { AuthRepository } from '@/features/auth/domain/repositories/auth.repository';
import { asTenantId, asUserId } from '@/types/ids';

jest.mock('@/services/network/netinfo', () => ({
  networkAdapter: {
    isOnline: jest.fn(),
  },
}));

jest.mock('@/storage/secure/keychain', () => ({
  saveTokens: jest.fn(async () => undefined),
  loadTokens: jest.fn(async () => null),
  clearTokens: jest.fn(async () => undefined),
}));

jest.mock('@/storage/kv/mmkv', () => {
  const store = new Map();
  return {
    kvStorage: {
      getString: (k: string) => store.get(k),
      getBoolean: (k: string) => store.get(k),
      set: (k: string, v: unknown) => store.set(k, v),
    },
  };
});

const { networkAdapter } = jest.requireMock('@/services/network/netinfo') as {
  networkAdapter: { isOnline: jest.Mock };
};
const { saveTokens } = jest.requireMock('@/storage/secure/keychain') as {
  saveTokens: jest.Mock;
};

describe('LoginUseCase', () => {
  const session = {
    accessToken: 'a',
    refreshToken: 'r',
    tenantId: asTenantId('t1'),
    user: {
      id: asUserId('u1'),
      email: 'op@stockwell.test',
      displayName: 'Op',
      role: 'operator',
    },
  };

  it('succeeds and stores tokens in keychain', async () => {
    networkAdapter.isOnline.mockResolvedValue(true);
    const repo: AuthRepository = {
      login: jest.fn(async () => Result.ok(session)),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    const useCase = createLoginUseCase(repo);
    const result = await useCase.execute({ email: 'op@stockwell.test', password: 'secret' });
    expect(result.ok).toBe(true);
    expect(saveTokens).toHaveBeenCalledWith({
      accessToken: 'a',
      refreshToken: 'r',
    });
  });

  it('rejects offline first-time login', async () => {
    networkAdapter.isOnline.mockResolvedValue(false);
    const repo: AuthRepository = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    const useCase = createLoginUseCase(repo);
    const result = await useCase.execute({ email: 'op@stockwell.test', password: 'secret' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(OfflineError);
    }
    expect(repo.login).not.toHaveBeenCalled();
  });

  it('maps wrong password via repository error', async () => {
    networkAdapter.isOnline.mockResolvedValue(true);
    const repo: AuthRepository = {
      login: jest.fn(async () => Result.err(new AuthError())),
      refresh: jest.fn(),
      logout: jest.fn(),
    };
    const useCase = createLoginUseCase(repo);
    const result = await useCase.execute({ email: 'op@stockwell.test', password: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AuthError);
    }
  });
});
