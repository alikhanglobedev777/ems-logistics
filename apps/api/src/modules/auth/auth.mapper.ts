import type {
  AuthResponse,
  CurrentUser,
  MeResponse,
  SuccessResponse,
} from '@ems/api-contract';
import type { AuthUserRecord } from './auth.repository';

export function toCurrentUser(
  user: AuthUserRecord,
  permissions: string[],
): CurrentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roleName,
    roleLabel: user.roleLabel,
    permissions,
  };
}

export function toAuthResponse(
  user: AuthUserRecord,
  permissions: string[],
  accessToken: string,
  refreshToken: string,
): AuthResponse {
  return {
    data: {
      accessToken,
      refreshToken,
      user: toCurrentUser(user, permissions),
    },
    message: 'Success',
  };
}

export function toMeResponse(
  user: AuthUserRecord,
  permissions: string[],
): MeResponse {
  return {
    data: toCurrentUser(user, permissions),
    message: 'Success',
  };
}

export function toLogoutResponse(): SuccessResponse {
  return { data: null, message: 'Success' };
}
