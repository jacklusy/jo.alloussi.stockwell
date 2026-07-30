import type { AxiosInstance } from 'axios';

import { Result } from '@/core/domain';
import type { AppError } from '@/core/errors';
import { mapAxiosError } from '@/services/api/error-mapper';
import { loginResponseSchema } from '@/features/auth/data/dto/auth.dto';
import { mapLoginDto } from '@/features/auth/data/mappers/auth.mapper';
import type {
  AuthCredentials,
  AuthRepository,
  AuthSession,
} from '@/features/auth/domain/repositories/auth.repository';

export function createAuthRepository(client: AxiosInstance): AuthRepository {
  return {
    async login(credentials: AuthCredentials): Promise<Result<AuthSession, AppError>> {
      try {
        const { data } = await client.post('/auth/login', {
          email: credentials.email,
          password: credentials.password,
        });
        const dto = loginResponseSchema.parse(data);
        return Result.ok(mapLoginDto(dto));
      } catch (error) {
        return Result.err(mapAxiosError(error));
      }
    },

    async refresh(refreshToken: string): Promise<Result<AuthSession, AppError>> {
      try {
        const { data } = await client.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        const dto = loginResponseSchema.parse(data);
        return Result.ok(mapLoginDto(dto));
      } catch (error) {
        return Result.err(mapAxiosError(error));
      }
    },

    async logout(): Promise<Result<void, AppError>> {
      try {
        await client.post('/auth/logout');
        return Result.ok(undefined);
      } catch (error) {
        return Result.err(mapAxiosError(error));
      }
    },
  };
}
