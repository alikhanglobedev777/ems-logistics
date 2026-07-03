import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

@Injectable()
export class TripLegsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('trip_legs')
      .innerJoin('routes', 'routes.id', 'trip_legs.route_id')
      .innerJoin('stations as origin_station', 'origin_station.id', 'trip_legs.origin_station_id')
      .innerJoin('stations as destination_station', 'destination_station.id', 'trip_legs.destination_station_id')
      .leftJoin('vehicles as override_vehicle', 'override_vehicle.id', 'trip_legs.override_vehicle_id')
      .leftJoin('drivers as override_driver', 'override_driver.id', 'trip_legs.override_driver_id')
      .select([
        'trip_legs.id as id',
        'trip_legs.master_trip_id as masterTripId',
        'trip_legs.sequence_no as sequenceNo',
        'trip_legs.route_id as routeId',
        'routes.name as routeName',
        'trip_legs.origin_station_id as originStationId',
        'origin_station.name as originStationName',
        'trip_legs.destination_station_id as destinationStationId',
        'destination_station.name as destinationStationName',
        'trip_legs.planned_departure_at as plannedDepartureAt',
        'trip_legs.actual_departure_at as actualDepartureAt',
        'trip_legs.actual_arrival_at as actualArrivalAt',
        'trip_legs.status as status',
        'trip_legs.override_vehicle_id as overrideVehicleId',
        'override_vehicle.vehicle_number as overrideVehicleNumber',
        'trip_legs.override_driver_id as overrideDriverId',
        'override_driver.name as overrideDriverName',
        'trip_legs.override_reason as overrideReason',
        'trip_legs.override_approved_by_user_id as overrideApprovedByUserId',
        'trip_legs.created_at as createdAt',
        'trip_legs.updated_at as updatedAt',
      ]);
  }

  findById(tripLegId: number) {
    return this.base().where('trip_legs.id', '=', tripLegId).executeTakeFirst();
  }

  findByMasterTrip(masterTripId: number) {
    return this.base().where('trip_legs.master_trip_id', '=', masterTripId).orderBy('trip_legs.sequence_no asc').execute();
  }

  masterTripById(masterTripId: number) {
    return this.db
      .selectFrom('master_trips')
      .select(['id', 'vehicle_id as vehicleId', 'driver_id as driverId', 'status', 'current_station_id as currentStationId'])
      .where('id', '=', masterTripId)
      .executeTakeFirst();
  }

  vehicleById(vehicleId: number) {
    return this.db.selectFrom('vehicles').select(['id', 'status', 'is_active as isActive']).where('id', '=', vehicleId).executeTakeFirst();
  }

  driverById(driverId: number) {
    return this.db.selectFrom('drivers').select(['id', 'is_active as isActive']).where('id', '=', driverId).executeTakeFirst();
  }

  bookingById(bookingId: number) {
    return this.db.selectFrom('bookings').select(['id', 'status', 'route_id as routeId']).where('id', '=', bookingId).executeTakeFirst();
  }

  existingLegBooking(tripLegId: number, bookingId: number) {
    return this.db
      .selectFrom('trip_leg_bookings')
      .select('id')
      .where('trip_leg_id', '=', tripLegId)
      .where('booking_id', '=', bookingId)
      .executeTakeFirst();
  }

  async assignBooking(tripLegId: number, bookingId: number, allocatedWeightTons: string | null) {
    await this.db
      .insertInto('trip_leg_bookings')
      .values({ trip_leg_id: tripLegId, booking_id: bookingId, allocated_weight_tons: allocatedWeightTons })
      .execute();
    return this.findById(tripLegId);
  }

  async dispatch(tripLegId: number, createdByUserId: number | null) {
    const now = new Date();
    return this.db.transaction().execute(async (trx) => {
      const leg = await trx
        .selectFrom('trip_legs')
        .innerJoin('master_trips', 'master_trips.id', 'trip_legs.master_trip_id')
        .select([
          'trip_legs.id as id',
          'trip_legs.master_trip_id as masterTripId',
          'trip_legs.origin_station_id as originStationId',
          'master_trips.vehicle_id as vehicleId',
        ])
        .where('trip_legs.id', '=', tripLegId)
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('trip_legs')
        .set({ status: 'dispatched', actual_departure_at: now, updated_at: now })
        .where('id', '=', tripLegId)
        .executeTakeFirst();
      await trx
        .updateTable('master_trips')
        .set({ status: 'in_transit', actual_start_at: now, updated_at: now })
        .where('id', '=', leg.masterTripId)
        .executeTakeFirst();
      await trx
        .updateTable('vehicles')
        .set({ status: 'in_transit', updated_at: now })
        .where('id', '=', leg.vehicleId)
        .executeTakeFirst();
      await trx
        .updateTable('bookings')
        .set({ status: 'in_transit', updated_at: now })
        .where('id', 'in', trx.selectFrom('trip_leg_bookings').select('booking_id').where('trip_leg_id', '=', tripLegId))
        .execute();
      await trx
        .insertInto('trip_events')
        .values({
          master_trip_id: leg.masterTripId,
          trip_leg_id: tripLegId,
          event_type: 'leg_dispatched',
          title: 'Trip leg dispatched',
          station_id: leg.originStationId,
          created_by_user_id: createdByUserId,
        })
        .execute();
    }).then(() => this.findById(tripLegId));
  }

  async complete(tripLegId: number, createdByUserId: number | null) {
    const now = new Date();
    return this.db.transaction().execute(async (trx) => {
      const leg = await trx
        .selectFrom('trip_legs')
        .innerJoin('master_trips', 'master_trips.id', 'trip_legs.master_trip_id')
        .select([
          'trip_legs.id as id',
          'trip_legs.master_trip_id as masterTripId',
          'trip_legs.destination_station_id as destinationStationId',
          'master_trips.vehicle_id as vehicleId',
        ])
        .where('trip_legs.id', '=', tripLegId)
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('trip_legs')
        .set({ status: 'completed', actual_arrival_at: now, updated_at: now })
        .where('id', '=', tripLegId)
        .executeTakeFirst();

      const nextLeg = await trx
        .selectFrom('trip_legs')
        .select('id')
        .where('master_trip_id', '=', leg.masterTripId)
        .where('status', '=', 'planned')
        .orderBy('sequence_no asc')
        .executeTakeFirst();

      await trx
        .updateTable('master_trips')
        .set({
          current_station_id: leg.destinationStationId,
          status: nextLeg ? 'in_transit' : 'completed',
          completed_at: nextLeg ? null : now,
          updated_at: now,
        })
        .where('id', '=', leg.masterTripId)
        .executeTakeFirst();
      await trx
        .updateTable('vehicles')
        .set({ current_station_id: leg.destinationStationId, status: nextLeg ? 'assigned' : 'available', updated_at: now })
        .where('id', '=', leg.vehicleId)
        .executeTakeFirst();
      await trx
        .updateTable('bookings')
        .set({ status: 'delivered', updated_at: now })
        .where('id', 'in', trx.selectFrom('trip_leg_bookings').select('booking_id').where('trip_leg_id', '=', tripLegId))
        .execute();
      await trx
        .insertInto('trip_events')
        .values({
          master_trip_id: leg.masterTripId,
          trip_leg_id: tripLegId,
          event_type: 'leg_completed',
          title: 'Trip leg completed',
          station_id: leg.destinationStationId,
          created_by_user_id: createdByUserId,
        })
        .execute();
    }).then(() => this.findById(tripLegId));
  }

  async emergencyOverride(tripLegId: number, input: { vehicleId: number | null; driverId: number | null; reason: string; approvedByUserId: number | null }) {
    const patch: Updateable<EMSDB['trip_legs']> = {
      override_vehicle_id: input.vehicleId,
      override_driver_id: input.driverId,
      override_reason: input.reason,
      override_approved_by_user_id: input.approvedByUserId,
      updated_at: new Date(),
    };
    await this.db.updateTable('trip_legs').set(patch).where('id', '=', tripLegId).executeTakeFirst();
    return this.findById(tripLegId);
  }
}
