import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type DriverAdvanceCreateInput = {
  advanceNumber: string;
  masterTripId: number;
  driverId: number;
  advanceType: string;
  amount: string;
  paymentMethod: string;
  reason: string | null;
  status: string;
  createdByUserId: number | null;
};

export type DriverAdvanceUpdateInput = {
  status?: string;
  issuedAt?: Date | null;
  issuedByUserId?: number | null;
  cancelledReason?: string | null;
};

export type DriverAdvanceFilters = {
  search?: string;
  status?: string;
  masterTripId?: number;
  driverId?: number;
};

@Injectable()
export class DriverAdvancesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseSelect() {
    return this.db
      .selectFrom('driver_advances')
      .innerJoin('master_trips', 'master_trips.id', 'driver_advances.master_trip_id')
      .innerJoin('drivers', 'drivers.id', 'driver_advances.driver_id')
      .select([
        'driver_advances.id as id',
        'driver_advances.advance_number as advanceNumber',
        'driver_advances.master_trip_id as masterTripId',
        'master_trips.trip_number as tripNumber',
        'driver_advances.driver_id as driverId',
        'drivers.name as driverName',
        'driver_advances.advance_type as advanceType',
        'driver_advances.amount as amount',
        'driver_advances.payment_method as paymentMethod',
        'driver_advances.reason as reason',
        'driver_advances.issued_at as issuedAt',
        'driver_advances.status as status',
        'driver_advances.cancelled_reason as cancelledReason',
        'driver_advances.created_by_user_id as createdByUserId',
        'driver_advances.issued_by_user_id as issuedByUserId',
        'driver_advances.created_at as createdAt',
        'driver_advances.updated_at as updatedAt',
      ]);
  }

  findAll(filters: DriverAdvanceFilters, offset: number, limit: number) {
    return this.baseSelect()
      .$if(Boolean(filters.search), (qb) => qb.where('driver_advances.advance_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('driver_advances.status', '=', filters.status!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('driver_advances.master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('driver_advances.driver_id', '=', filters.driverId!))
      .orderBy('driver_advances.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: DriverAdvanceFilters) {
    const row = await this.db
      .selectFrom('driver_advances')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where('advance_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('status', '=', filters.status!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('driver_id', '=', filters.driverId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.baseSelect().where('driver_advances.id', '=', id).executeTakeFirst();
  }

  findByAdvanceNumber(advanceNumber: string) {
    return this.db.selectFrom('driver_advances').select('id').where('advance_number', '=', advanceNumber).executeTakeFirst();
  }

  masterTripById(masterTripId: number) {
    return this.db
      .selectFrom('master_trips')
      .innerJoin('drivers', 'drivers.id', 'master_trips.driver_id')
      .select(['master_trips.id as id', 'master_trips.trip_number as tripNumber', 'master_trips.driver_id as driverId', 'drivers.name as driverName'])
      .where('master_trips.id', '=', masterTripId)
      .executeTakeFirst();
  }

  async create(input: DriverAdvanceCreateInput) {
    const insert: Insertable<EMSDB['driver_advances']> = {
      advance_number: input.advanceNumber,
      master_trip_id: input.masterTripId,
      driver_id: input.driverId,
      advance_type: input.advanceType,
      amount: input.amount,
      payment_method: input.paymentMethod,
      reason: input.reason,
      status: input.status,
      created_by_user_id: input.createdByUserId,
    };
    const row = await this.db.insertInto('driver_advances').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async update(advanceId: number, input: DriverAdvanceUpdateInput) {
    const patch: Updateable<EMSDB['driver_advances']> = { updated_at: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.issuedAt !== undefined) patch.issued_at = input.issuedAt;
    if (input.issuedByUserId !== undefined) patch.issued_by_user_id = input.issuedByUserId;
    if (input.cancelledReason !== undefined) patch.cancelled_reason = input.cancelledReason;
    await this.db.updateTable('driver_advances').set(patch).where('id', '=', advanceId).executeTakeFirst();
    return this.findById(advanceId);
  }
}
