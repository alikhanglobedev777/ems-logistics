import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

type CreateRoleInput = {
  name: string;
  label: string;
  permissionIds: number[];
};

type UpdateRoleInput = {
  name?: string;
  label?: string;
  permissionIds?: number[];
};

@Injectable()
export class RolesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  findAll(offset: number, limit: number) {
    return this.baseRoleQuery()
      .orderBy('roles.name', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countAll() {
    const result = await this.db
      .selectFrom('roles')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    return result.total;
  }

  findById(roleId: number) {
    return this.baseRoleQuery().where('roles.id', '=', roleId).executeTakeFirst();
  }

  findByName(name: string) {
    return this.db.selectFrom('roles').select('id').where('name', '=', name).executeTakeFirst();
  }

  findAllPermissions() {
    return this.db
      .selectFrom('permissions')
      .select(['id', 'key', 'label', 'group_name as groupName', 'created_at as createdAt'])
      .orderBy('key', 'asc')
      .execute();
  }

  findPermissionsByKeys(keys: string[]) {
    if (keys.length === 0) return Promise.resolve([]);

    return this.db
      .selectFrom('permissions')
      .select(['id', 'key', 'label', 'group_name as groupName', 'created_at as createdAt'])
      .where('key', 'in', keys)
      .orderBy('key', 'asc')
      .execute();
  }

  findPermissionsForRoleIds(roleIds: number[]) {
    if (roleIds.length === 0) return Promise.resolve([]);

    return this.db
      .selectFrom('role_permissions')
      .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
      .select([
        'role_permissions.role_id as roleId',
        'permissions.id as id',
        'permissions.key as key',
        'permissions.label as label',
        'permissions.group_name as groupName',
        'permissions.created_at as createdAt',
      ])
      .where('role_permissions.role_id', 'in', roleIds)
      .orderBy('permissions.key', 'asc')
      .execute();
  }

  async create(input: CreateRoleInput) {
    return this.db.transaction().execute(async (trx) => {
      const role = await trx
        .insertInto('roles')
        .values({ name: input.name, label: input.label, is_system: false })
        .returning('id')
        .executeTakeFirstOrThrow();

      if (input.permissionIds.length > 0) {
        await trx
          .insertInto('role_permissions')
          .values(
            input.permissionIds.map((permissionId) => ({
              role_id: role.id,
              permission_id: permissionId,
            })),
          )
          .execute();
      }

      return role.id;
    });
  }

  async update(roleId: number, input: UpdateRoleInput) {
    await this.db.transaction().execute(async (trx) => {
      const patch: Updateable<EMSDB['roles']> = { updated_at: new Date() };
      if (input.name !== undefined) patch.name = input.name;
      if (input.label !== undefined) patch.label = input.label;

      await trx.updateTable('roles').set(patch).where('id', '=', roleId).executeTakeFirst();

      if (input.permissionIds !== undefined) {
        await trx.deleteFrom('role_permissions').where('role_id', '=', roleId).execute();

        if (input.permissionIds.length > 0) {
          await trx
            .insertInto('role_permissions')
            .values(
              input.permissionIds.map((permissionId) => ({
                role_id: roleId,
                permission_id: permissionId,
              })),
            )
            .execute();
        }
      }
    });
  }

  private baseRoleQuery() {
    return this.db
      .selectFrom('roles')
      .select([
        'roles.id as id',
        'roles.name as name',
        'roles.label as label',
        'roles.is_system as isSystem',
        'roles.created_at as createdAt',
        'roles.updated_at as updatedAt',
      ]);
  }
}
