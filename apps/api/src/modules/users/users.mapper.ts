import type {
  User,
  UserResponse,
  UsersListResponse,
} from '@ems/api-contract';

export type UserMapperSource = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  roleId: number;
  roleName: string;
  roleLabel: string;
};

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toUser(user: UserMapperSource): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    role: { id: user.roleId, name: user.roleName, label: user.roleLabel },
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

export function toUserResponse(user: UserMapperSource): UserResponse {
  return { data: toUser(user), message: 'Success' };
}

export function toUsersListResponse(
  users: UserMapperSource[],
  page: number,
  limit: number,
  total: number,
): UsersListResponse {
  return {
    data: users.map(toUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
