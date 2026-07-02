import type {
  Permission,
  PermissionsListResponse,
} from '@ems/api-contract';

export type PermissionMapperSource = {
  id: number;
  key: string;
  label: string;
  groupName: string;
  createdAt: unknown;
};

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toPermission(permission: PermissionMapperSource): Permission {
  return {
    id: permission.id,
    key: permission.key,
    label: permission.label,
    groupName: permission.groupName,
    createdAt: toIso(permission.createdAt),
  };
}

export function toPermissionsListResponse(
  permissions: PermissionMapperSource[],
  page: number,
  limit: number,
  total: number,
): PermissionsListResponse {
  return {
    data: permissions.map(toPermission),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
