import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

@Injectable()
export class PermissionsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  findAll(offset: number, limit: number) {
    return this.db
      .selectFrom('permissions')
      .select(['id', 'key', 'label', 'group_name as groupName', 'created_at as createdAt'])
      .orderBy('group_name', 'asc')
      .orderBy('key', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countAll() {
    const result = await this.db
      .selectFrom('permissions')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
    return result.total;
  }
}
