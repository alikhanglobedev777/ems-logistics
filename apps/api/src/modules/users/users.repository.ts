import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateUserInput = {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  roleId: number;
  isActive: boolean;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string | null;
  passwordHash?: string;
  roleId?: number;
  isActive?: boolean;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  findAll(offset: number, limit: number) {
    return this.baseUserQuery()
      .orderBy('users.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countAll() {
    const result = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();

    return result.total;
  }

  findById(userId: number) {
    return this.baseUserQuery().where('users.id', '=', userId).executeTakeFirst();
  }

  findByEmail(email: string) {
    return this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();
  }

  findRoleById(roleId: number) {
    return this.db
      .selectFrom('roles')
      .select(['id', 'name', 'label'])
      .where('id', '=', roleId)
      .executeTakeFirst();
  }

  async create(input: CreateUserInput) {
    const user = await this.db
      .insertInto('users')
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password_hash: input.passwordHash,
        role_id: input.roleId,
        is_active: input.isActive,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(user.id);
  }

  async update(userId: number, input: UpdateUserInput) {
    const patch: Updateable<EMSDB['users']> = { updated_at: new Date() };

    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.passwordHash !== undefined) patch.password_hash = input.passwordHash;
    if (input.roleId !== undefined) patch.role_id = input.roleId;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    await this.db.updateTable('users').set(patch).where('id', '=', userId).executeTakeFirst();

    return this.findById(userId);
  }

  private baseUserQuery() {
    return this.db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'users.id as id',
        'users.name as name',
        'users.email as email',
        'users.phone as phone',
        'users.is_active as isActive',
        'users.created_at as createdAt',
        'users.updated_at as updatedAt',
        'roles.id as roleId',
        'roles.name as roleName',
        'roles.label as roleLabel',
      ]);
  }
}
