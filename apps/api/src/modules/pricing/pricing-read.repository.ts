import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

@Injectable()
export class PricingReadRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  findLatestFuelPrice(fuelType: string) {
    return this.db
      .selectFrom('fuel_price_snapshots')
      .select([
        'id',
        'fuel_type as fuelType',
        'price_per_liter as pricePerLiter',
        'source',
        'effective_at as effectiveAt',
        'created_by_user_id as createdByUserId',
        'created_at as createdAt',
      ])
      .where('fuel_type', '=', fuelType)
      .where('effective_at', '<=', new Date())
      .orderBy('effective_at', 'desc')
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
  }

  findActiveFuelProfile(routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('route_fuel_profiles')
      .innerJoin('routes', 'routes.id', 'route_fuel_profiles.route_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'route_fuel_profiles.vehicle_type_id')
      .select([
        'route_fuel_profiles.id',
        'route_fuel_profiles.route_id as routeId',
        'routes.name as routeName',
        'route_fuel_profiles.vehicle_type_id as vehicleTypeId',
        'vehicle_types.name as vehicleTypeName',
        'vehicle_types.code as vehicleTypeCode',
        'route_fuel_profiles.expected_liters as expectedLiters',
        'route_fuel_profiles.reserve_liters as reserveLiters',
        'route_fuel_profiles.notes',
        'route_fuel_profiles.is_active as isActive',
        'route_fuel_profiles.created_at as createdAt',
        'route_fuel_profiles.updated_at as updatedAt',
      ])
      .where('route_fuel_profiles.route_id', '=', routeId)
      .where('route_fuel_profiles.vehicle_type_id', '=', vehicleTypeId)
      .where('route_fuel_profiles.is_active', '=', true)
      .executeTakeFirst();
  }

  findActiveOverheadProfile(routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('route_overhead_profiles')
      .innerJoin('routes', 'routes.id', 'route_overhead_profiles.route_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'route_overhead_profiles.vehicle_type_id')
      .select([
        'route_overhead_profiles.id',
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
      ])
      .where('route_overhead_profiles.route_id', '=', routeId)
      .where('route_overhead_profiles.vehicle_type_id', '=', vehicleTypeId)
      .where('route_overhead_profiles.is_active', '=', true)
      .executeTakeFirst();
  }
}
