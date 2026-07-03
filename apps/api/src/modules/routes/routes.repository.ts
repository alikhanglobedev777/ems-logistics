import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateRouteInput = {
  originStationId: number;
  destinationStationId: number;
  name: string;
  distanceKm: string | null;
  estimatedDurationHours: string | null;
  roadCondition: string;
  isActive: boolean;
};

export type UpdateRouteInput = Partial<CreateRouteInput>;

@Injectable()
export class RoutesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('routes')
      .innerJoin('stations as origin', 'origin.id', 'routes.origin_station_id')
      .innerJoin('stations as destination', 'destination.id', 'routes.destination_station_id')
      .select([
        'routes.id as id',
        'routes.name as name',
        'routes.distance_km as distanceKm',
        'routes.estimated_duration_hours as estimatedDurationHours',
        'routes.road_condition as roadCondition',
        'routes.is_active as isActive',
        'routes.created_at as createdAt',
        'routes.updated_at as updatedAt',
        'origin.id as originStationId',
        'origin.name as originStationName',
        'origin.code as originStationCode',
        'destination.id as destinationStationId',
        'destination.name as destinationStationName',
        'destination.code as destinationStationCode',
      ]);
  }

  stationExists(stationId: number) {
    return this.db.selectFrom('stations').select('id').where('id', '=', stationId).executeTakeFirst();
  }

  findByStations(originStationId: number, destinationStationId: number) {
    return this.db
      .selectFrom('routes')
      .select('id')
      .where('origin_station_id', '=', originStationId)
      .where('destination_station_id', '=', destinationStationId)
      .executeTakeFirst();
  }

  findById(routeId: number) {
    return this.base().where('routes.id', '=', routeId).executeTakeFirst();
  }

  findAll(filters: { search?: string; stationId?: number; isActive?: boolean }, offset: number, limit: number) {
    let query = this.base();

    if (filters.search) {
      query = query.where('routes.name', 'ilike', `%${filters.search}%`);
    }

    if (filters.stationId !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb('routes.origin_station_id', '=', filters.stationId!),
          eb('routes.destination_station_id', '=', filters.stationId!),
        ]),
      );
    }

    if (filters.isActive !== undefined) {
      query = query.where('routes.is_active', '=', filters.isActive);
    }

    return query.orderBy('routes.name').offset(offset).limit(limit).execute();
  }

  async count(filters: { search?: string; stationId?: number; isActive?: boolean }) {
    let query = this.db.selectFrom('routes').select((eb) => eb.fn.countAll<number>().as('total'));

    if (filters.search) query = query.where('name', 'ilike', `%${filters.search}%`);
    if (filters.stationId !== undefined) {
      query = query.where((eb) =>
        eb.or([
          eb('origin_station_id', '=', filters.stationId!),
          eb('destination_station_id', '=', filters.stationId!),
        ]),
      );
    }
    if (filters.isActive !== undefined) query = query.where('is_active', '=', filters.isActive);

    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: CreateRouteInput) {
    const row = await this.db
      .insertInto('routes')
      .values({
        origin_station_id: input.originStationId,
        destination_station_id: input.destinationStationId,
        name: input.name,
        distance_km: input.distanceKm,
        estimated_duration_hours: input.estimatedDurationHours,
        road_condition: input.roadCondition,
        is_active: input.isActive,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(row.id);
  }

  async update(routeId: number, input: UpdateRouteInput) {
    const patch: Updateable<EMSDB['routes']> = { updated_at: new Date() };

    if (input.originStationId !== undefined) patch.origin_station_id = input.originStationId;
    if (input.destinationStationId !== undefined) patch.destination_station_id = input.destinationStationId;
    if (input.name !== undefined) patch.name = input.name;
    if (input.distanceKm !== undefined) patch.distance_km = input.distanceKm;
    if (input.estimatedDurationHours !== undefined) patch.estimated_duration_hours = input.estimatedDurationHours;
    if (input.roadCondition !== undefined) patch.road_condition = input.roadCondition;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    await this.db.updateTable('routes').set(patch).where('id', '=', routeId).executeTakeFirst();
    return this.findById(routeId);
  }
}
