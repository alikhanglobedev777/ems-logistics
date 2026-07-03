import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type RouteOverheadCostsInput = {
  maintenanceCost: string;
  tyreCost: string;
  oilServiceCost: string;
  depreciationCost: string;
  insuranceTaxCost: string;
  routeRiskCost: string;
  emptyReturnRiskCost: string;
  workshopReserveCost: string;
  totalOverhead: string;
};

export type CreateRouteOverheadProfileInput = RouteOverheadCostsInput & {
  routeId: number;
  vehicleTypeId: number;
  isActive: boolean;
};

export type UpdateRouteOverheadProfileInput = Partial<CreateRouteOverheadProfileInput>;

@Injectable()
export class RouteOverheadProfilesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('route_overhead_profiles')
      .innerJoin('routes', 'routes.id', 'route_overhead_profiles.route_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'route_overhead_profiles.vehicle_type_id')
      .select([
        'route_overhead_profiles.id as id',
        'route_overhead_profiles.route_id as routeId',
        'routes.name as routeName',
        'route_overhead_profiles.vehicle_type_id as vehicleTypeId',
        'vehicle_types.name as vehicleTypeName',
        'vehicle_types.code as vehicleTypeCode',
        'route_overhead_profiles.maintenance_cost as maintenanceCost',
        'route_overhead_profiles.tyre_cost as tyreCost',
        'route_overhead_profiles.oil_service_cost as oilServiceCost',
        'route_overhead_profiles.depreciation_cost as depreciationCost',
        'route_overhead_profiles.insurance_tax_cost as insuranceTaxCost',
        'route_overhead_profiles.route_risk_cost as routeRiskCost',
        'route_overhead_profiles.empty_return_risk_cost as emptyReturnRiskCost',
        'route_overhead_profiles.workshop_reserve_cost as workshopReserveCost',
        'route_overhead_profiles.total_overhead as totalOverhead',
        'route_overhead_profiles.is_active as isActive',
        'route_overhead_profiles.created_at as createdAt',
        'route_overhead_profiles.updated_at as updatedAt',
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
      .selectFrom('route_overhead_profiles')
      .select('id')
      .where('route_id', '=', routeId)
      .where('vehicle_type_id', '=', vehicleTypeId)
      .executeTakeFirst();
  }

  findActiveByRouteAndVehicle(routeId: number, vehicleTypeId: number) {
    return this.base()
      .where('route_overhead_profiles.route_id', '=', routeId)
      .where('route_overhead_profiles.vehicle_type_id', '=', vehicleTypeId)
      .where('route_overhead_profiles.is_active', '=', true)
      .executeTakeFirst();
  }

  findById(id: number) {
    return this.base().where('route_overhead_profiles.id', '=', id).executeTakeFirst();
  }

  findAll(filters: { routeId?: number; vehicleTypeId?: number; isActive?: boolean }, offset: number, limit: number) {
    let query = this.base();
    if (filters.routeId !== undefined) query = query.where('route_overhead_profiles.route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('route_overhead_profiles.vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('route_overhead_profiles.is_active', '=', filters.isActive);
    return query.orderBy('routes.name').offset(offset).limit(limit).execute();
  }

  async count(filters: { routeId?: number; vehicleTypeId?: number; isActive?: boolean }) {
    let query = this.db
      .selectFrom('route_overhead_profiles')
      .select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.routeId !== undefined) query = query.where('route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('is_active', '=', filters.isActive);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: CreateRouteOverheadProfileInput) {
    const row = await this.db
      .insertInto('route_overhead_profiles')
      .values({
        route_id: input.routeId,
        vehicle_type_id: input.vehicleTypeId,
        maintenance_cost: input.maintenanceCost,
        tyre_cost: input.tyreCost,
        oil_service_cost: input.oilServiceCost,
        depreciation_cost: input.depreciationCost,
        insurance_tax_cost: input.insuranceTaxCost,
        route_risk_cost: input.routeRiskCost,
        empty_return_risk_cost: input.emptyReturnRiskCost,
        workshop_reserve_cost: input.workshopReserveCost,
        total_overhead: input.totalOverhead,
        is_active: input.isActive,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(row.id);
  }

  async update(id: number, input: UpdateRouteOverheadProfileInput) {
    const patch: Updateable<EMSDB['route_overhead_profiles']> = { updated_at: new Date() };
    if (input.routeId !== undefined) patch.route_id = input.routeId;
    if (input.vehicleTypeId !== undefined) patch.vehicle_type_id = input.vehicleTypeId;
    if (input.maintenanceCost !== undefined) patch.maintenance_cost = input.maintenanceCost;
    if (input.tyreCost !== undefined) patch.tyre_cost = input.tyreCost;
    if (input.oilServiceCost !== undefined) patch.oil_service_cost = input.oilServiceCost;
    if (input.depreciationCost !== undefined) patch.depreciation_cost = input.depreciationCost;
    if (input.insuranceTaxCost !== undefined) patch.insurance_tax_cost = input.insuranceTaxCost;
    if (input.routeRiskCost !== undefined) patch.route_risk_cost = input.routeRiskCost;
    if (input.emptyReturnRiskCost !== undefined) patch.empty_return_risk_cost = input.emptyReturnRiskCost;
    if (input.workshopReserveCost !== undefined) patch.workshop_reserve_cost = input.workshopReserveCost;
    if (input.totalOverhead !== undefined) patch.total_overhead = input.totalOverhead;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    await this.db.updateTable('route_overhead_profiles').set(patch).where('id', '=', id).executeTakeFirst();
    return this.findById(id);
  }
}
