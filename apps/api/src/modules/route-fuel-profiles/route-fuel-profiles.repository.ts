import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateRouteFuelProfileInput = {
  routeId: number;
  vehicleTypeId: number;
  expectedLiters: string;
  reserveLiters: string;
  notes: string | null;
  isActive: boolean;
};

export type UpdateRouteFuelProfileInput = Partial<CreateRouteFuelProfileInput>;

@Injectable()
export class RouteFuelProfilesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('route_fuel_profiles')
      .innerJoin('routes', 'routes.id', 'route_fuel_profiles.route_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'route_fuel_profiles.vehicle_type_id')
      .select([
        'route_fuel_profiles.id as id',
        'route_fuel_profiles.route_id as routeId',
        'routes.name as routeName',
        'route_fuel_profiles.vehicle_type_id as vehicleTypeId',
        'vehicle_types.name as vehicleTypeName',
        'vehicle_types.code as vehicleTypeCode',
        'route_fuel_profiles.expected_liters as expectedLiters',
        'route_fuel_profiles.reserve_liters as reserveLiters',
        'route_fuel_profiles.notes as notes',
        'route_fuel_profiles.is_active as isActive',
        'route_fuel_profiles.created_at as createdAt',
        'route_fuel_profiles.updated_at as updatedAt',
      ]);
  }

  routeExists(routeId: number) {
    return this.db.selectFrom('routes').select('id').where('id', '=', routeId).executeTakeFirst();
  }

  vehicleTypeExists(vehicleTypeId: number) {
    return this.db.selectFrom('vehicle_types').select('id').where('id', '=', vehicleTypeId).executeTakeFirst();
  }

  findByRouteAndVehicle(routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('route_fuel_profiles')
      .select('id')
      .where('route_id', '=', routeId)
      .where('vehicle_type_id', '=', vehicleTypeId)
      .executeTakeFirst();
  }

  findActiveByRouteAndVehicle(routeId: number, vehicleTypeId: number) {
    return this.base()
      .where('route_fuel_profiles.route_id', '=', routeId)
      .where('route_fuel_profiles.vehicle_type_id', '=', vehicleTypeId)
      .where('route_fuel_profiles.is_active', '=', true)
      .executeTakeFirst();
  }

  findById(id: number) {
    return this.base().where('route_fuel_profiles.id', '=', id).executeTakeFirst();
  }

  findAll(filters: { routeId?: number; vehicleTypeId?: number; isActive?: boolean }, offset: number, limit: number) {
    let query = this.base();
    if (filters.routeId !== undefined) query = query.where('route_fuel_profiles.route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('route_fuel_profiles.vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('route_fuel_profiles.is_active', '=', filters.isActive);
    return query.orderBy('routes.name').offset(offset).limit(limit).execute();
  }

  async count(filters: { routeId?: number; vehicleTypeId?: number; isActive?: boolean }) {
    let query = this.db
      .selectFrom('route_fuel_profiles')
      .select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.routeId !== undefined) query = query.where('route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('is_active', '=', filters.isActive);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: CreateRouteFuelProfileInput) {
    const row = await this.db
      .insertInto('route_fuel_profiles')
      .values({
        route_id: input.routeId,
        vehicle_type_id: input.vehicleTypeId,
        expected_liters: input.expectedLiters,
        reserve_liters: input.reserveLiters,
        notes: input.notes,
        is_active: input.isActive,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(row.id);
  }

  async update(id: number, input: UpdateRouteFuelProfileInput) {
    const patch: Updateable<EMSDB['route_fuel_profiles']> = { updated_at: new Date() };
    if (input.routeId !== undefined) patch.route_id = input.routeId;
    if (input.vehicleTypeId !== undefined) patch.vehicle_type_id = input.vehicleTypeId;
    if (input.expectedLiters !== undefined) patch.expected_liters = input.expectedLiters;
    if (input.reserveLiters !== undefined) patch.reserve_liters = input.reserveLiters;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    await this.db.updateTable('route_fuel_profiles').set(patch).where('id', '=', id).executeTakeFirst();
    return this.findById(id);
  }
}
