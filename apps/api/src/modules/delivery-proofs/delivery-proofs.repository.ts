import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

export type DeliveryProofFilters = { search?: string; bookingId?: number; tripLegId?: number };
export type DeliveryProofCreateInput = {
  proofNumber: string;
  bookingId: number;
  masterTripId: number | null;
  tripLegId: number | null;
  receiverName: string;
  receiverPhone: string | null;
  receiverCnic: string | null;
  goodsCondition: string;
  remarks: string | null;
  proofImageUrls: string[];
  deliveredAt: Date;
  createdByUserId: number | null;
};

@Injectable()
export class DeliveryProofsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseSelect() {
    return this.db
      .selectFrom('delivery_proofs')
      .innerJoin('bookings', 'bookings.id', 'delivery_proofs.booking_id')
      .innerJoin('customers', 'customers.id', 'bookings.customer_id')
      .leftJoin('master_trips', 'master_trips.id', 'delivery_proofs.master_trip_id')
      .leftJoin('trip_legs', 'trip_legs.id', 'delivery_proofs.trip_leg_id')
      .leftJoin('routes', 'routes.id', 'trip_legs.route_id')
      .select([
        'delivery_proofs.id as id',
        'delivery_proofs.proof_number as proofNumber',
        'delivery_proofs.booking_id as bookingId',
        'bookings.booking_number as bookingNumber',
        'customers.name as customerName',
        'delivery_proofs.master_trip_id as masterTripId',
        'master_trips.trip_number as tripNumber',
        'delivery_proofs.trip_leg_id as tripLegId',
        'routes.name as routeName',
        'delivery_proofs.receiver_name as receiverName',
        'delivery_proofs.receiver_phone as receiverPhone',
        'delivery_proofs.receiver_cnic as receiverCnic',
        'delivery_proofs.goods_condition as goodsCondition',
        'delivery_proofs.remarks as remarks',
        'delivery_proofs.proof_image_urls as proofImageUrls',
        'delivery_proofs.delivered_at as deliveredAt',
        'delivery_proofs.created_by_user_id as createdByUserId',
        'delivery_proofs.created_at as createdAt',
        'delivery_proofs.updated_at as updatedAt',
      ]);
  }

  findAll(filters: DeliveryProofFilters, offset: number, limit: number) {
    return this.baseSelect()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('delivery_proofs.proof_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('delivery_proofs.booking_id', '=', filters.bookingId!))
      .$if(Boolean(filters.tripLegId), (qb) => qb.where('delivery_proofs.trip_leg_id', '=', filters.tripLegId!))
      .orderBy('delivery_proofs.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: DeliveryProofFilters) {
    const row = await this.db
      .selectFrom('delivery_proofs')
      .innerJoin('bookings', 'bookings.id', 'delivery_proofs.booking_id')
      .innerJoin('customers', 'customers.id', 'bookings.customer_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('delivery_proofs.proof_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('delivery_proofs.booking_id', '=', filters.bookingId!))
      .$if(Boolean(filters.tripLegId), (qb) => qb.where('delivery_proofs.trip_leg_id', '=', filters.tripLegId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.baseSelect().where('delivery_proofs.id', '=', id).executeTakeFirst();
  }

  findByNumber(proofNumber: string) {
    return this.db.selectFrom('delivery_proofs').select('id').where('proof_number', '=', proofNumber).executeTakeFirst();
  }

  findByBookingId(bookingId: number) {
    return this.db.selectFrom('delivery_proofs').select('id').where('booking_id', '=', bookingId).executeTakeFirst();
  }

  bookingById(bookingId: number) {
    return this.db
      .selectFrom('bookings')
      .select(['id', 'booking_number as bookingNumber', 'status'])
      .where('id', '=', bookingId)
      .executeTakeFirst();
  }

  tripLegContext(tripLegId: number) {
    return this.db
      .selectFrom('trip_legs')
      .innerJoin('master_trips', 'master_trips.id', 'trip_legs.master_trip_id')
      .select(['trip_legs.id as id', 'trip_legs.master_trip_id as masterTripId'])
      .where('trip_legs.id', '=', tripLegId)
      .executeTakeFirst();
  }

  async create(input: DeliveryProofCreateInput) {
    const insert: Insertable<EMSDB['delivery_proofs']> = {
      proof_number: input.proofNumber,
      booking_id: input.bookingId,
      master_trip_id: input.masterTripId,
      trip_leg_id: input.tripLegId,
      receiver_name: input.receiverName,
      receiver_phone: input.receiverPhone,
      receiver_cnic: input.receiverCnic,
      goods_condition: input.goodsCondition,
      remarks: input.remarks,
      proof_image_urls: input.proofImageUrls,
      delivered_at: input.deliveredAt,
      created_by_user_id: input.createdByUserId,
    };
    const rowId = await this.db.transaction().execute(async (trx) => {
      const row = await trx.insertInto('delivery_proofs').values(insert).returning('id').executeTakeFirstOrThrow();
      await trx.updateTable('bookings').set({ status: 'pod_uploaded', updated_at: new Date() }).where('id', '=', input.bookingId).executeTakeFirst();
      if (input.masterTripId !== null) {
        await trx.insertInto('trip_events').values({
          master_trip_id: input.masterTripId,
          trip_leg_id: input.tripLegId,
          event_type: 'pod_uploaded',
          title: 'Proof of delivery uploaded',
          description: input.remarks,
          station_id: null,
          created_by_user_id: input.createdByUserId,
        }).execute();
      }
      return row.id;
    });
    return this.findById(rowId);
  }
}
