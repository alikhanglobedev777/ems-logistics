import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Transaction } from 'kysely';
import { DB } from '../../database/database.tokens';

type DatabaseExecutor = Kysely<EMSDB> | Transaction<EMSDB>;

export type AuthUserRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  isActive: boolean;
  roleId: number;
  roleName: string;
  roleLabel: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  roleId: number;
};

type CreateSessionInput = {
  refreshTokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class AuthRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  findRoleByName(roleName: string) {
    return this.db
      .selectFrom('roles')
      .select(['id', 'name', 'label'])
      .where('name', '=', roleName)
      .executeTakeFirst();
  }

  findUserByEmail(email: string) {
    return this.findUserByEmailWithDb(this.db, email);
  }

  findUserById(userId: number) {
    return this.findUserByIdWithDb(this.db, userId);
  }

  async countUsers() {
    const result = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();

    return Number(result.total);
  }

  async createUserWithSession(
    userInput: CreateUserInput,
    sessionInput: CreateSessionInput,
  ): Promise<AuthUserRecord> {
    return this.db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto('users')
        .values({
          name: userInput.name,
          email: userInput.email,
          phone: userInput.phone,
          password_hash: userInput.passwordHash,
          role_id: userInput.roleId,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('user_refresh_sessions')
        .values({
          user_id: user.id,
          refresh_token_hash: sessionInput.refreshTokenHash,
          expires_at: sessionInput.expiresAt,
        })
        .executeTakeFirstOrThrow();

      const createdUser = await this.findUserByIdWithDb(trx, user.id);

      if (!createdUser) {
        throw new Error('Created user was not found');
      }

      return createdUser;
    });
  }

  createRefreshSession(userId: number, input: CreateSessionInput) {
    return this.db
      .insertInto('user_refresh_sessions')
      .values({
        user_id: userId,
        refresh_token_hash: input.refreshTokenHash,
        expires_at: input.expiresAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
  }

  findRefreshSession(refreshTokenHash: string) {
    return this.db
      .selectFrom('user_refresh_sessions as sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'sessions.id as sessionId',
        'sessions.expires_at as expiresAt',
        'sessions.revoked_at as revokedAt',
        'users.id as id',
        'users.name as name',
        'users.email as email',
        'users.phone as phone',
        'users.password_hash as passwordHash',
        'users.is_active as isActive',
        'roles.id as roleId',
        'roles.name as roleName',
        'roles.label as roleLabel',
      ])
      .where('sessions.refresh_token_hash', '=', refreshTokenHash)
      .executeTakeFirst();
  }

  async rotateRefreshSession(
    sessionId: number,
    userId: number,
    input: CreateSessionInput,
  ): Promise<boolean> {
    return this.db.transaction().execute(async (trx) => {
      const revoked = await trx
        .updateTable('user_refresh_sessions')
        .set({ revoked_at: new Date() })
        .where('id', '=', sessionId)
        .where('revoked_at', 'is', null)
        .executeTakeFirst();

      if (revoked.numUpdatedRows === 0n) {
        return false;
      }

      await trx
        .insertInto('user_refresh_sessions')
        .values({
          user_id: userId,
          refresh_token_hash: input.refreshTokenHash,
          expires_at: input.expiresAt,
        })
        .executeTakeFirstOrThrow();

      return true;
    });
  }

  revokeRefreshSession(refreshTokenHash: string) {
    return this.db
      .updateTable('user_refresh_sessions')
      .set({ revoked_at: new Date() })
      .where('refresh_token_hash', '=', refreshTokenHash)
      .where('revoked_at', 'is', null)
      .executeTakeFirst();
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const userRole = await this.db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select('roles.name as roleName')
      .where('users.id', '=', userId)
      .executeTakeFirst();

    if (!userRole) {
      return [];
    }

    if (userRole.roleName === 'super_admin') {
      const permissions = await this.db
        .selectFrom('permissions')
        .select('key')
        .orderBy('key', 'asc')
        .execute();

      return permissions.map((permission) => permission.key);
    }

    const rows = await this.db
      .selectFrom('users')
      .innerJoin('role_permissions', 'role_permissions.role_id', 'users.role_id')
      .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
      .select('permissions.key as key')
      .where('users.id', '=', userId)
      .orderBy('permissions.key', 'asc')
      .execute();

    return rows.map((row) => row.key);
  }

  private findUserByEmailWithDb(db: DatabaseExecutor, email: string) {
    return this.baseUserQuery(db).where('users.email', '=', email).executeTakeFirst();
  }

  private findUserByIdWithDb(db: DatabaseExecutor, userId: number) {
    return this.baseUserQuery(db).where('users.id', '=', userId).executeTakeFirst();
  }

  private baseUserQuery(db: DatabaseExecutor) {
    return db
      .selectFrom('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select([
        'users.id as id',
        'users.name as name',
        'users.email as email',
        'users.phone as phone',
        'users.password_hash as passwordHash',
        'users.is_active as isActive',
        'roles.id as roleId',
        'roles.name as roleName',
        'roles.label as roleLabel',
      ]);
  }
}
