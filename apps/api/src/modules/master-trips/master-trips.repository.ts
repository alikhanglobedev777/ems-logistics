import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type MasterTripCreateInput = {
  tripNumber: string;
  vehicleId: number;
  driverId: number;
  startStationId: number;
  currentStationId: number;
  status: string;
  plannedStartAt: Date | null;
  createdByUserId: number | null;
};

export type TripLegCreateInput = {
  masterTripId: number;
  sequenceNo: number;
  routeId: number;
  originStationId: number;
  destinationStationId: number;
  plannedDepartureAt: Date | null;
  status: string;
};

@Injectable()
export class MasterTripsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('master_trips')
      .innerJoin('vehicles', 'vehicles.id', 'master_trips.vehicle_id')
      .innerJoin('drivers', 'drivers.id', 'master_trips.driver_id')
      .innerJoin('stations as start_station', 'start_station.id', 'master_trips.start_station_id')
      .innerJoin('stations as current_station', 'current_station.id', 'master_trips.current_station_id')
      .select([
        'master_trips.id as id',
        'master_trips.trip_number as tripNumber',
        'master_trips.vehicle_id as vehicleId',
        'vehicles.vehicle_number as vehicleNumber',
        'master_trips.driver_id as driverId',
        'drivers.name as driverName',
        'master_trips.start_station_id as startStationId',
        'start_station.name as startStationName',
        'master_trips.current_station_id as currentStationId',
        'current_station.name as currentStationName',
        'master_trips.status as status',
        'master_trips.planned_start_at as plannedStartAt',
        'master_trips.actual_start_at as actualStartAt',
        'master_trips.completed_at as completedAt',
        'master_trips.created_by_user_id as createdByUserId',
        'master_trips.created_at as createdAt',
        'master_trips.updated_at as updatedAt',
      ]);
  }

  findById(masterTripId: number) {
    return this.base().where('master_trips.id', '=', masterTripId).executeTakeFirst();
  }

  findByNumber(tripNumber: string) {
    return this.db.selectFrom('master_trips').select('id').where('trip_number', '=', tripNumber).executeTakeFirst();
  }

  findAll(filters: { search?: string; status?: string; vehicleId?: number; driverId?: number }, offset: number, limit: number) {
    let query = this.base();
    if (filters.search) {
      query = query.where((eb) => eb.or([
        eb('master_trips.trip_number', 'ilike', `%${filters.search}%`),
        eb('vehicles.vehicle_number', 'ilike', `%${filters.search}%`),
        eb('drivers.name', 'ilike', `%${filters.search}%`),
      ]));
    }
    if (filters.status !== undefined) query = query.where('master_trips.status', '=', filters.status);
    if (filters.vehicleId !== undefined) query = query.where('master_trips.vehicle_id', '=', filters.vehicleId);
    if (filters.driverId !== undefined) query = query.where('master_trips.driver_id', '=', filters.driverId);
    return query.orderBy('master_trips.created_at desc').offset(offset).limit(limit).execute();
  }

  async count(filters: { search?: string; status?: string; vehicleId?: number; driverId?: number }) {
    let query = this.db
      .selectFrom('master_trips')
      .innerJoin('vehicles', 'vehicles.id', 'master_trips.vehicle_id')
      .innerJoin('drivers', 'drivers.id', 'master_trips.driver_id')
      .select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.search) {
      query = query.where((eb) => eb.or([
        eb('master_trips.trip_number', 'ilike', `%${filters.search}%`),
        eb('vehicles.vehicle_number', 'ilike', `%${filters.search}%`),
        eb('drivers.name', 'ilike', `%${filters.search}%`),
      ]));
    }
    if (filters.status !== undefined) query = query.where('master_trips.status', '=', filters.status);
    if (filters.vehicleId !== undefined) query = query.where('master_trips.vehicle_id', '=', filters.vehicleId);
    if (filters.driverId !== undefined) query = query.where('master_trips.driver_id', '=', filters.driverId);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  vehicleById(vehicleId: number) {
    return this.db
      .selectFrom('vehicles')
      .select(['id', 'current_station_id as currentStationId', 'status', 'is_active as isActive'])
      .where('id', '=', vehicleId)
      .executeTakeFirst();
  }

  driverById(driverId: number) {
    return this.db.selectFrom('drivers').select(['id', 'is_active as isActive']).where('id', '=', driverId).executeTakeFirst();
  }

  stationById(stationId: number) {
    return this.db.selectFrom('stations').select(['id', 'is_active as isActive']).where('id', '=', stationId).executeTakeFirst();
  }

  routeById(routeId: number) {
    return this.db
      .selectFrom('routes')
      .select(['id', 'origin_station_id as originStationId', 'destination_station_id as destinationStationId', 'is_active as isActive'])
      .where('id', '=', routeId)
      .executeTakeFirst();
  }

  async create(input: MasterTripCreateInput) {
    const createdId = await this.db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('master_trips')
        .values({
          trip_number: input.tripNumber,
          vehicle_id: input.vehicleId,
          driver_id: input.driverId,
          start_station_id: input.startStationId,
          current_station_id: input.currentStationId,
          status: input.status,
          planned_start_at: input.plannedStartAt,
          created_by_user_id: input.createdByUserId,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('vehicles')
        .set({ status: 'assigned', updated_at: new Date() })
        .where('id', '=', input.vehicleId)
        .executeTakeFirst();

      return created.id;
    });

    return this.findById(createdId);
  }

  async update(masterTripId: number, input: { status?: string; currentStationId?: number; actualStartAt?: Date | null; completedAt?: Date | null }) {
    const patch: Updateable<EMSDB['master_trips']> = { updated_at: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.currentStationId !== undefined) patch.current_station_id = input.currentStationId;
    if (input.actualStartAt !== undefined) patch.actual_start_at = input.actualStartAt;
    if (input.completedAt !== undefined) patch.completed_at = input.completedAt;
    await this.db.updateTable('master_trips').set(patch).where('id', '=', masterTripId).executeTakeFirst();
    return this.findById(masterTripId);
  }

  async addLeg(input: TripLegCreateInput) {
    const created = await this.db
      .insertInto('trip_legs')
      .values({
        master_trip_id: input.masterTripId,
        sequence_no: input.sequenceNo,
        route_id: input.routeId,
        origin_station_id: input.originStationId,
        destination_station_id: input.destinationStationId,
        planned_departure_at: input.plannedDepartureAt,
        status: input.status,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    await this.createEvent(input.masterTripId, created.id, 'leg_created', 'Trip leg created', input.originStationId, null, null);
    return created.id;
  }

  async nextSequenceNo(masterTripId: number) {
    const row = await this.db
      .selectFrom('trip_legs')
      .select((eb) => eb.fn.max<number>('sequence_no').as('maxSequenceNo'))
      .where('master_trip_id', '=', masterTripId)
      .executeTakeFirst();
    return Number(row?.maxSequenceNo ?? 0) + 1;
  }

  async createEvent(masterTripId: number, tripLegId: number | null, eventType: string, title: string, stationId: number | null, description: string | null, createdByUserId: number | null) {
    await this.db
      .insertInto('trip_events')
      .values({
        master_trip_id: masterTripId,
        trip_leg_id: tripLegId,
        event_type: eventType,
        title,
        description,
        station_id: stationId,
        created_by_user_id: createdByUserId,
      })
      .execute();
  }

  timeline(masterTripId: number) {
    return this.db
      .selectFrom('trip_events')
      .leftJoin('stations', 'stations.id', 'trip_events.station_id')
      .select([
        'trip_events.id as id',
        'trip_events.master_trip_id as masterTripId',
        'trip_events.trip_leg_id as tripLegId',
        'trip_events.event_type as eventType',
        'trip_events.title as title',
        'trip_events.description as description',
        'trip_events.station_id as stationId',
        'stations.name as stationName',
        'trip_events.created_by_user_id as createdByUserId',
        'trip_events.created_at as createdAt',
      ])
      .where('trip_events.master_trip_id', '=', masterTripId)
      .orderBy('trip_events.created_at asc')
      .execute();
  }
}
