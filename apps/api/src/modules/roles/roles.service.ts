import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateRoleRequest, UpdateRoleRequest } from '@ems/api-contract';
import { toRoleResponse, toRolesListResponse } from './roles.mapper';
import { RolesRepository } from './roles.repository';

const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

function positiveInt(value: unknown, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException({
      error: { code: 'INVALID_NUMBER', message: `${fieldName} must be a positive integer` },
    });
  }
  return parsed;
}

function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      error: { code: 'REQUIRED_FIELD', message: `${fieldName} is required` },
    });
  }
  return value.trim();
}

function permissionKeys(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_PERMISSION_KEYS',
        message: 'permissionKeys must be an array of permission keys',
      },
    });
  }
  return [...new Set(value.map((item) => String(item).trim()))];
}

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async getRoles(pageValue?: unknown, limitValue?: unknown) {
    const page = pageValue === undefined ? 1 : positiveInt(pageValue, 'page');
    const limit = limitValue === undefined ? 20 : positiveInt(limitValue, 'limit');
    if (limit > 100) {
      throw new BadRequestException({
        error: { code: 'LIMIT_TOO_LARGE', message: 'limit cannot exceed 100' },
      });
    }

    const [roles, total] = await Promise.all([
      this.rolesRepository.findAll((page - 1) * limit, limit),
      this.rolesRepository.countAll(),
    ]);
    const permissionMap = await this.permissionMapForRoles(roles);

    return toRolesListResponse(roles, permissionMap, page, limit, total);
  }

  async getRoleById(roleIdValue: unknown) {
    const role = await this.findRole(roleIdValue);
    const permissionMap = await this.permissionMapForRoles([role]);

    return toRoleResponse(role, permissionMap.get(role.id) ?? []);
  }

  async createRole(body: CreateRoleRequest) {
    const name = this.parseRoleName(body.name);
    const label = requiredString(body.label, 'label');
    const permissions = await this.resolvePermissions(permissionKeys(body.permissionKeys));

    if (await this.rolesRepository.findByName(name)) {
      throw new ConflictException({
        error: { code: 'ROLE_ALREADY_EXISTS', message: 'A role with this name already exists' },
      });
    }

    const roleId = await this.rolesRepository.create({
      name,
      label,
      permissionIds: permissions.map((permission) => permission.id),
    });

    return this.getRoleById(roleId);
  }

  async updateRole(roleIdValue: unknown, body: UpdateRoleRequest) {
    const role = await this.findRole(roleIdValue);
    let name: string | undefined;
    let label: string | undefined;
    let resolvedPermissionIds: number[] | undefined;

    if (body.name !== undefined) {
      if (role.isSystem) {
        throw new BadRequestException({
          error: { code: 'SYSTEM_ROLE_NAME_LOCKED', message: 'System role names cannot be changed' },
        });
      }
      name = this.parseRoleName(body.name);
      const duplicate = await this.rolesRepository.findByName(name);
      if (duplicate && duplicate.id !== role.id) {
        throw new ConflictException({
          error: { code: 'ROLE_ALREADY_EXISTS', message: 'A role with this name already exists' },
        });
      }
    }

    if (body.label !== undefined) label = requiredString(body.label, 'label');
    if (body.permissionKeys !== undefined) {
      if (role.name === 'super_admin') {
        throw new BadRequestException({
          error: {
            code: 'SUPER_ADMIN_PERMISSIONS_LOCKED',
            message: 'Super admin always has every permission',
          },
        });
      }
      const permissions = await this.resolvePermissions(permissionKeys(body.permissionKeys));
      resolvedPermissionIds = permissions.map((permission) => permission.id);
    }

    await this.rolesRepository.update(role.id, {
      name,
      label,
      permissionIds: resolvedPermissionIds,
    });

    return this.getRoleById(role.id);
  }

  private async findRole(roleIdValue: unknown) {
    const role = await this.rolesRepository.findById(positiveInt(roleIdValue, 'roleId'));
    if (!role) {
      throw new NotFoundException({
        error: { code: 'ROLE_NOT_FOUND', message: 'Role not found' },
      });
    }
    return role;
  }

  private parseRoleName(value: unknown) {
    const name = requiredString(value, 'name').toLowerCase();
    if (!ROLE_NAME_PATTERN.test(name)) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_ROLE_NAME',
          message: 'Role name must use lowercase letters, numbers, and underscores',
        },
      });
    }
    return name;
  }

  private async resolvePermissions(keys: string[]) {
    const permissions = await this.rolesRepository.findPermissionsByKeys(keys);
    if (permissions.length !== keys.length) {
      const found = new Set(permissions.map((permission) => permission.key));
      throw new BadRequestException({
        error: {
          code: 'PERMISSION_NOT_FOUND',
          message: 'One or more permissions do not exist',
          details: keys.filter((key) => !found.has(key)),
        },
      });
    }
    return permissions;
  }

  private async permissionMapForRoles(
    roles: Array<{ id: number; name: string }>,
  ) {
    const roleIds = roles.map((role) => role.id);
    const assigned = await this.rolesRepository.findPermissionsForRoleIds(roleIds);
    const allPermissions = roles.some((role) => role.name === 'super_admin')
      ? await this.rolesRepository.findAllPermissions()
      : [];
    const map = new Map<number, typeof allPermissions>();

    for (const role of roles) {
      map.set(
        role.id,
        role.name === 'super_admin'
          ? allPermissions
          : assigned.filter((permission) => permission.roleId === role.id),
      );
    }

    return map;
  }

}
