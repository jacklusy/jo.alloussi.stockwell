import type { AuthSession } from '@/features/auth/domain/repositories/auth.repository';
import type { LoginResponseDto } from '@/features/auth/data/dto/auth.dto';
import { asTenantId, asUserId } from '@/types/ids';

export function mapLoginDto(dto: LoginResponseDto): AuthSession {
  return {
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
    tenantId: asTenantId(dto.tenant_id),
    user: {
      id: asUserId(dto.user.id),
      email: dto.user.email,
      displayName: dto.user.display_name,
      role: dto.user.role,
    },
  };
}
