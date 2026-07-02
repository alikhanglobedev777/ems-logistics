import { Inject, Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import type { DB as EMSDB } from '@ems/db';
import { DB } from '../../database/database.tokens';

type CreateCityInput = {
  name: string;
  province?: string | null;
  country?: string | null;
};

@Injectable()
export class CitiesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  async findAll() {
    return this.db
      .selectFrom('cities')
      .select(['id', 'name', 'province', 'country', 'created_at'])
      .orderBy('name', 'asc')
      .execute();
  }

  async create(input: CreateCityInput) {
    return this.db
      .insertInto('cities')
      .values({
        name: input.name,
        province: input.province ?? null,
        country: input.country ?? 'Pakistan',
      })
      .returning(['id', 'name', 'province', 'country', 'created_at'])
      .executeTakeFirstOrThrow();
  }
}

