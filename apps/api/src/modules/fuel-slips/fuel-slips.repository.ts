import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type FuelSlipFilters = { search?: string; status?: string; vendorId?: number; masterTripId?: number; vehicleId?: number; driverId?: number };
export type FuelSlipCreateInput = {
  slipNumber: string;
  fuelVendorId: number;
  masterTripId: number | null;
  tripLegId: number | null;
  vehicleId: number;
  driverId: number;
  fuelType: string;
  liters: string;
  pricePerLiter: string;
  totalAmount: string;
  slipDate: string;
  odometerReading: string | null;
  stationName: string | null;
  notes: string | null;
};
export type FuelSlipUpdateInput = { status?: string; verifiedByUserId?: number | null; verifiedAt?: Date | null; rejectedReason?: string | null };

@Injectable()
export class FuelSlipsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseSelect() {
    return this.db
      .selectFrom('fuel_slips')
      .innerJoin('fuel_vendors', 'fuel_vendors.id', 'fuel_slips.fuel_vendor_id')
      .leftJoin('master_trips', 'master_trips.id', 'fuel_slips.master_trip_id')
      .leftJoin('trip_legs', 'trip_legs.id', 'fuel_slips.trip_leg_id')
      .leftJoin('routes', 'routes.id', 'trip_legs.route_id')
      .innerJoin('vehicles', 'vehicles.id', 'fuel_slips.vehicle_id')
      .innerJoin('drivers', 'drivers.id', 'fuel_slips.driver_id')
      .select([
        'fuel_slips.id as id',
        'fuel_slips.slip_number as slipNumber',
        'fuel_slips.fuel_vendor_id as fuelVendorId',
        'fuel_vendors.name as fuelVendorName',
        'fuel_slips.master_trip_id as masterTripId',
        'master_trips.trip_number as tripNumber',
        'fuel_slips.trip_leg_id as tripLegId',
        'routes.name as routeName',
        'fuel_slips.vehicle_id as vehicleId',
        'vehicles.vehicle_number as vehicleRegistrationNumber',
        'fuel_slips.driver_id as driverId',
        'drivers.name as driverName',
        'fuel_slips.fuel_type as fuelType',
        'fuel_slips.liters as liters',
        'fuel_slips.price_per_liter as pricePerLiter',
        'fuel_slips.total_amount as totalAmount',
        'fuel_slips.slip_date as slipDate',
        'fuel_slips.odometer_reading as odometerReading',
        'fuel_slips.station_name as stationName',
        'fuel_slips.status as status',
        'fuel_slips.verified_by_user_id as verifiedByUserId',
        'fuel_slips.verified_at as verifiedAt',
        'fuel_slips.rejected_reason as rejectedReason',
        'fuel_slips.notes as notes',
        'fuel_slips.created_at as createdAt',
        'fuel_slips.updated_at as updatedAt',
      ]);
  }

  findAll(filters: FuelSlipFilters, offset: number, limit: number) {
    return this.baseSelect()
      .$if(Boolean(filters.search), (qb) => qb.where('fuel_slips.slip_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('fuel_slips.status', '=', filters.status!))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_slips.fuel_vendor_id', '=', filters.vendorId!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('fuel_slips.master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.vehicleId), (qb) => qb.where('fuel_slips.vehicle_id', '=', filters.vehicleId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('fuel_slips.driver_id', '=', filters.driverId!))
      .orderBy('fuel_slips.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: FuelSlipFilters) {
    const row = await this.db.selectFrom('fuel_slips')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where('slip_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('status', '=', filters.status!))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_vendor_id', '=', filters.vendorId!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.vehicleId), (qb) => qb.where('vehicle_id', '=', filters.vehicleId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('driver_id', '=', filters.driverId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.baseSelect().where('fuel_slips.id', '=', id).executeTakeFirst();
  }

  findBySlipNumber(slipNumber: string) {
    return this.db.selectFrom('fuel_slips').select('id').where('slip_number', '=', slipNumber).executeTakeFirst();
  }

  vendorById(id: number) {
    return this.db.selectFrom('fuel_vendors').select(['id', 'is_active as isActive']).where('id', '=', id).executeTakeFirst();
  }

  masterTripById(id: number) {
    return this.db.selectFrom('master_trips').select(['id', 'vehicle_id as vehicleId', 'driver_id as driverId']).where('id', '=', id).executeTakeFirst();
  }

  tripLegById(id: number) {
    return this.db
      .selectFrom('trip_legs')
      .innerJoin('master_trips', 'master_trips.id', 'trip_legs.master_trip_id')
      .select(['trip_legs.id as id', 'trip_legs.master_trip_id as masterTripId', 'master_trips.vehicle_id as vehicleId', 'master_trips.driver_id as driverId'])
      .where('trip_legs.id', '=', id)
      .executeTakeFirst();
  }

  async create(input: FuelSlipCreateInput) {
    const insert: Insertable<EMSDB['fuel_slips']> = {
      slip_number: input.slipNumber,
      fuel_vendor_id: input.fuelVendorId,
      master_trip_id: input.masterTripId,
      trip_leg_id: input.tripLegId,
      vehicle_id: input.vehicleId,
      driver_id: input.driverId,
      fuel_type: input.fuelType,
      liters: input.liters,
      price_per_liter: input.pricePerLiter,
      total_amount: input.totalAmount,
      slip_date: input.slipDate,
      odometer_reading: input.odometerReading,
      station_name: input.stationName,
      notes: input.notes,
      status: 'pending',
    };
    const row = await this.db.insertInto('fuel_slips').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async update(id: number, input: FuelSlipUpdateInput) {
    const patch: Updateable<EMSDB['fuel_slips']> = { updated_at: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.verifiedByUserId !== undefined) patch.verified_by_user_id = input.verifiedByUserId;
    if (input.verifiedAt !== undefined) patch.verified_at = input.verifiedAt;
    if (input.rejectedReason !== undefined) patch.rejected_reason = input.rejectedReason;
    await this.db.updateTable('fuel_slips').set(patch).where('id', '=', id).executeTakeFirst();
    return this.findById(id);
  }
}

