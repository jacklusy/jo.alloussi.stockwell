/**
 * Auth port — application depends on this, not axios.
 */
import type { Result } from '@/core/domain';
import type { AppError } from '@/core/errors';
import type { TenantId, UserId } from '@/types/ids';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: UserId;
    email: string;
    displayName: string;
    role: string;
  };
  tenantId: TenantId;
};

export type AuthRepository = {
  login: (credentials: AuthCredentials) => Promise<Result<AuthSession, AppError>>;
  refresh: (refreshToken: string) => Promise<Result<AuthSession, AppError>>;
  logout: () => Promise<Result<void, AppError>>;
};
