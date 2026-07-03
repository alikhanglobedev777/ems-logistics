import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateFuelPriceSnapshotInput = {
  fuelType: string;
  pricePerLiter: string;
  source: string;
  effectiveAt: Date;
  createdByUserId: number | null;
};

@Injectable()
export class FuelPriceSnapshotsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db.selectFrom('fuel_price_snapshots').select([
      'id',
      'fuel_type as fuelType',
      'price_per_liter as pricePerLiter',
      'source',
      'effective_at as effectiveAt',
      'created_by_user_id as createdByUserId',
      'created_at as createdAt',
    ]);
  }

  findById(id: number) {
    return this.base().where('id', '=', id).executeTakeFirst();
  }

  findLatest(fuelType = 'diesel') {
    return this.base()
      .where('fuel_type', '=', fuelType)
      .where('effective_at', '<=', new Date())
      .orderBy('effective_at', 'desc')
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
  }

  findAll(filters: { fuelType?: string; source?: string }, offset: number, limit: number) {
    let query = this.base();
    if (filters.fuelType) query = query.where('fuel_type', '=', filters.fuelType);
    if (filters.source) query = query.where('source', '=', filters.source);
    return query.orderBy('effective_at', 'desc').offset(offset).limit(limit).execute();
  }

  async count(filters: { fuelType?: string; source?: string }) {
    let query = this.db
      .selectFrom('fuel_price_snapshots')
      .select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.fuelType) query = query.where('fuel_type', '=', filters.fuelType);
    if (filters.source) query = query.where('source', '=', filters.source);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: CreateFuelPriceSnapshotInput) {
    const row = await this.db
      .insertInto('fuel_price_snapshots')
      .values({
        fuel_type: input.fuelType,
        price_per_liter: input.pricePerLiter,
        source: input.source,
        effective_at: input.effectiveAt,
        created_by_user_id: input.createdByUserId,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(row.id);
  }
}
