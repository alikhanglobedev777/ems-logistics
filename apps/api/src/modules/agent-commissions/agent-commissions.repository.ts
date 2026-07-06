import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type AgentCommissionFilters = { search?: string; status?: string; agentId?: number; bookingId?: number };
export type AgentCommissionCreateInput = {
  commissionNumber: string;
  bookingId: number;
  agentId: number;
  commissionType: string;
  commissionValue: string | null;
  commissionAmount: string;
  payableAfter: string;
  notes: string | null;
  createdByUserId: number | null;
};

@Injectable()
export class AgentCommissionsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseSelect() {
    return this.db
      .selectFrom('agent_commissions')
      .innerJoin('bookings', 'bookings.id', 'agent_commissions.booking_id')
      .innerJoin('agents', 'agents.id', 'agent_commissions.agent_id')
      .select([
        'agent_commissions.id as id',
        'agent_commissions.commission_number as commissionNumber',
        'agent_commissions.booking_id as bookingId',
        'bookings.booking_number as bookingNumber',
        'agent_commissions.agent_id as agentId',
        'agents.name as agentName',
        'agent_commissions.commission_type as commissionType',
        'agent_commissions.commission_value as commissionValue',
        'agent_commissions.commission_amount as commissionAmount',
        'agent_commissions.status as status',
        'agent_commissions.payable_after as payableAfter',
        'agent_commissions.approved_at as approvedAt',
        'agent_commissions.approved_by_user_id as approvedByUserId',
        'agent_commissions.paid_at as paidAt',
        'agent_commissions.paid_by_user_id as paidByUserId',
        'agent_commissions.cancelled_reason as cancelledReason',
        'agent_commissions.notes as notes',
        'agent_commissions.created_by_user_id as createdByUserId',
        'agent_commissions.created_at as createdAt',
        'agent_commissions.updated_at as updatedAt',
      ]);
  }

  findAll(filters: AgentCommissionFilters, offset: number, limit: number) {
    return this.baseSelect()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('agent_commissions.commission_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('agents.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('agent_commissions.status', '=', filters.status!))
      .$if(Boolean(filters.agentId), (qb) => qb.where('agent_commissions.agent_id', '=', filters.agentId!))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('agent_commissions.booking_id', '=', filters.bookingId!))
      .orderBy('agent_commissions.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: AgentCommissionFilters) {
    const row = await this.db
      .selectFrom('agent_commissions')
      .innerJoin('bookings', 'bookings.id', 'agent_commissions.booking_id')
      .innerJoin('agents', 'agents.id', 'agent_commissions.agent_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('agent_commissions.commission_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('agents.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('agent_commissions.status', '=', filters.status!))
      .$if(Boolean(filters.agentId), (qb) => qb.where('agent_commissions.agent_id', '=', filters.agentId!))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('agent_commissions.booking_id', '=', filters.bookingId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.baseSelect().where('agent_commissions.id', '=', id).executeTakeFirst();
  }

  findByNumber(commissionNumber: string) {
    return this.db.selectFrom('agent_commissions').select('id').where('commission_number', '=', commissionNumber).executeTakeFirst();
  }

  findByBookingId(bookingId: number) {
    return this.db.selectFrom('agent_commissions').select('id').where('booking_id', '=', bookingId).executeTakeFirst();
  }

  bookingForCommission(bookingId: number) {
    return this.db
      .selectFrom('bookings')
      .leftJoin('agents', 'agents.id', 'bookings.agent_id')
      .select([
        'bookings.id as id',
        'bookings.booking_number as bookingNumber',
        'bookings.agent_id as agentId',
        'bookings.status as status',
        'bookings.final_freight_rate as finalFreightRate',
        'agents.commission_type as commissionType',
        'agents.commission_value as commissionValue',
      ])
      .where('bookings.id', '=', bookingId)
      .executeTakeFirst();
  }

  async create(input: AgentCommissionCreateInput) {
    const insert: Insertable<EMSDB['agent_commissions']> = {
      commission_number: input.commissionNumber,
      booking_id: input.bookingId,
      agent_id: input.agentId,
      commission_type: input.commissionType,
      commission_value: input.commissionValue,
      commission_amount: input.commissionAmount,
      status: 'pending',
      payable_after: input.payableAfter,
      notes: input.notes,
      created_by_user_id: input.createdByUserId,
    };
    const row = await this.db.insertInto('agent_commissions').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async update(id: number, input: { status?: string; approvedByUserId?: number | null; approvedAt?: Date | null; paidByUserId?: number | null; paidAt?: Date | null; cancelledReason?: string | null }) {
    const patch: Updateable<EMSDB['agent_commissions']> = { updated_at: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.approvedByUserId !== undefined) patch.approved_by_user_id = input.approvedByUserId;
    if (input.approvedAt !== undefined) patch.approved_at = input.approvedAt;
    if (input.paidByUserId !== undefined) patch.paid_by_user_id = input.paidByUserId;
    if (input.paidAt !== undefined) patch.paid_at = input.paidAt;
    if (input.cancelledReason !== undefined) patch.cancelled_reason = input.cancelledReason;
    await this.db.updateTable('agent_commissions').set(patch).where('id', '=', id).executeTakeFirst();
    return this.findById(id);
  }
}
