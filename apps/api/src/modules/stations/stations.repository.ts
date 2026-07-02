import { Inject, Injectable } from '@nestjs/common';
import type { Kysely, Updateable } from 'kysely';
import type { DB as EMSDB } from '@ems/db';
import { DB } from '../../database/database.tokens';

type CreateStationInput = {
  cityId: number;
  name: string;
  code?: string | null;
  address?: string | null;
  contactPhone?: string | null;
};

type UpdateStationInput = {
  cityId?: number;
  name?: string;
  code?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  isActive?: boolean;
};

@Injectable()
export class StationsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseStationQuery() {
    return this.db
      .selectFrom('stations')
      .innerJoin('cities', 'cities.id', 'stations.city_id')
      .select([
        'stations.id as id',
        'stations.city_id as cityId',
        'cities.name as cityName',
        'stations.name as name',
        'stations.code as code',
        'stations.address as address',
        'stations.contact_phone as contactPhone',
        'stations.is_active as isActive',
        'stations.created_at as createdAt',
      ]);
  }

  async cityExists(cityId: number) {
    const city = await this.db
      .selectFrom('cities')
      .select('id')
      .where('id', '=', cityId)
      .executeTakeFirst();

    return Boolean(city);
  }

  async findAll(filters: { cityId?: number; isActive?: boolean }) {
    let query = this.baseStationQuery();

    if (filters.cityId) {
      query = query.where('stations.city_id', '=', filters.cityId);
    }

    if (typeof filters.isActive === 'boolean') {
      query = query.where('stations.is_active', '=', filters.isActive);
    }

    return query.orderBy('stations.name', 'asc').execute();
  }

  async findById(stationId: number) {
    return this.baseStationQuery()
      .where('stations.id', '=', stationId)
      .executeTakeFirst();
  }

  async create(input: CreateStationInput) {
    const station = await this.db
      .insertInto('stations')
      .values({
        city_id: input.cityId,
        name: input.name,
        code: input.code ?? null,
        address: input.address ?? null,
        contact_phone: input.contactPhone ?? null,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    return this.findById(station.id);
  }

  async update(stationId: number, input: UpdateStationInput) {
    const patch: Updateable<EMSDB['stations']> = {};

    if (typeof input.cityId === 'number') patch.city_id = input.cityId;
    if (typeof input.name === 'string') patch.name = input.name;
    if ('code' in input) patch.code = input.code ?? null;
    if ('address' in input) patch.address = input.address ?? null;
    if ('contactPhone' in input) patch.contact_phone = input.contactPhone ?? null;
    if (typeof input.isActive === 'boolean') patch.is_active = input.isActive;

    if (Object.keys(patch).length === 0) {
      return this.findById(stationId);
    }

    await this.db
      .updateTable('stations')
      .set(patch)
      .where('id', '=', stationId)
      .executeTakeFirst();

    return this.findById(stationId);
  }
}

