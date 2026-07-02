import type { Role, RoleResponse, RolesListResponse } from '@ems/api-contract';
import {
  toPermission,
  type PermissionMapperSource,
} from '../permissions/permissions.mapper';

export type RoleMapperSource = {
  id: number;
  name: string;
  label: string;
  isSystem: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toRole(
  role: RoleMapperSource,
  permissions: PermissionMapperSource[],
): Role {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    isSystem: role.isSystem,
    permissions: permissions.map(toPermission),
    createdAt: toIso(role.createdAt),
    updatedAt: toIso(role.updatedAt),
  };
}

export function toRoleResponse(
  role: RoleMapperSource,
  permissions: PermissionMapperSource[],
): RoleResponse {
  return { data: toRole(role, permissions), message: 'Success' };
}

export function toRolesListResponse(
  roles: RoleMapperSource[],
  permissionsByRole: ReadonlyMap<number, PermissionMapperSource[]>,
  page: number,
  limit: number,
  total: number,
): RolesListResponse {
  return {
    data: roles.map((role) => toRole(role, permissionsByRole.get(role.id) ?? [])),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
