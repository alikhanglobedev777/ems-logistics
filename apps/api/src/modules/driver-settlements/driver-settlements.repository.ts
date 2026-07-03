import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type DriverSettlementFilters = {
  search?: string;
  status?: string;
  masterTripId?: number;
  driverId?: number;
};

export type DriverSettlementCreateInput = {
  settlementNumber: string;
  masterTripId: number;
  driverId: number;
  totalAdvanceAmount: string;
  totalApprovedExpenseAmount: string;
  payableToDriverAmount: string;
  recoverableFromDriverAmount: string;
  status: string;
  createdByUserId: number | null;
};

export type DriverSettlementUpdateInput = {
  totalAdvanceAmount?: string;
  totalApprovedExpenseAmount?: string;
  payableToDriverAmount?: string;
  recoverableFromDriverAmount?: string;
  status?: string;
  finalizedAt?: Date | null;
  paidAt?: Date | null;
  cancelledReason?: string | null;
  finalizedByUserId?: number | null;
  paidByUserId?: number | null;
};

export type DriverExpenseCreateInput = {
  masterTripId: number;
  driverId: number;
  expenseType: string;
  amount: string;
  description: string | null;
  incurredAt: string;
};

export type DriverExpenseUpdateInput = {
  status?: string;
  approvedByUserId?: number | null;
  approvedAt?: Date | null;
  rejectReason?: string | null;
};

@Injectable()
export class DriverSettlementsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private settlementSelect() {
    return this.db
      .selectFrom('driver_settlements')
      .innerJoin('master_trips', 'master_trips.id', 'driver_settlements.master_trip_id')
      .innerJoin('drivers', 'drivers.id', 'driver_settlements.driver_id')
      .select([
        'driver_settlements.id as id',
        'driver_settlements.settlement_number as settlementNumber',
        'driver_settlements.master_trip_id as masterTripId',
        'master_trips.trip_number as tripNumber',
        'driver_settlements.driver_id as driverId',
        'drivers.name as driverName',
        'driver_settlements.total_advance_amount as totalAdvanceAmount',
        'driver_settlements.total_approved_expense_amount as totalApprovedExpenseAmount',
        'driver_settlements.payable_to_driver_amount as payableToDriverAmount',
        'driver_settlements.recoverable_from_driver_amount as recoverableFromDriverAmount',
        'driver_settlements.status as status',
        'driver_settlements.finalized_at as finalizedAt',
        'driver_settlements.paid_at as paidAt',
        'driver_settlements.cancelled_reason as cancelledReason',
        'driver_settlements.created_by_user_id as createdByUserId',
        'driver_settlements.finalized_by_user_id as finalizedByUserId',
        'driver_settlements.paid_by_user_id as paidByUserId',
        'driver_settlements.created_at as createdAt',
        'driver_settlements.updated_at as updatedAt',
      ]);
  }

  private expenseSelect() {
    return this.db
      .selectFrom('driver_expenses')
      .innerJoin('master_trips', 'master_trips.id', 'driver_expenses.master_trip_id')
      .innerJoin('drivers', 'drivers.id', 'driver_expenses.driver_id')
      .select([
        'driver_expenses.id as id',
        'driver_expenses.master_trip_id as masterTripId',
        'master_trips.trip_number as tripNumber',
        'driver_expenses.driver_id as driverId',
        'drivers.name as driverName',
        'driver_expenses.expense_type as expenseType',
        'driver_expenses.amount as amount',
        'driver_expenses.description as description',
        'driver_expenses.incurred_at as incurredAt',
        'driver_expenses.status as status',
        'driver_expenses.approved_by_user_id as approvedByUserId',
        'driver_expenses.approved_at as approvedAt',
        'driver_expenses.reject_reason as rejectReason',
        'driver_expenses.created_at as createdAt',
        'driver_expenses.updated_at as updatedAt',
      ]);
  }

  findAll(filters: DriverSettlementFilters, offset: number, limit: number) {
    return this.settlementSelect()
      .$if(Boolean(filters.search), (qb) => qb.where('driver_settlements.settlement_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('driver_settlements.status', '=', filters.status!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('driver_settlements.master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('driver_settlements.driver_id', '=', filters.driverId!))
      .orderBy('driver_settlements.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: DriverSettlementFilters) {
    const row = await this.db
      .selectFrom('driver_settlements')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where('settlement_number', 'ilike', `%${filters.search}%`))
      .$if(Boolean(filters.status), (qb) => qb.where('status', '=', filters.status!))
      .$if(Boolean(filters.masterTripId), (qb) => qb.where('master_trip_id', '=', filters.masterTripId!))
      .$if(Boolean(filters.driverId), (qb) => qb.where('driver_id', '=', filters.driverId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.settlementSelect().where('driver_settlements.id', '=', id).executeTakeFirst();
  }

  findByMasterTrip(masterTripId: number) {
    return this.settlementSelect().where('driver_settlements.master_trip_id', '=', masterTripId).executeTakeFirst();
  }

  findBySettlementNumber(settlementNumber: string) {
    return this.db.selectFrom('driver_settlements').select('id').where('settlement_number', '=', settlementNumber).executeTakeFirst();
  }

  masterTripById(masterTripId: number) {
    return this.db
      .selectFrom('master_trips')
      .innerJoin('drivers', 'drivers.id', 'master_trips.driver_id')
      .select(['master_trips.id as id', 'master_trips.trip_number as tripNumber', 'master_trips.driver_id as driverId', 'drivers.name as driverName'])
      .where('master_trips.id', '=', masterTripId)
      .executeTakeFirst();
  }

  issuedAdvances(masterTripId: number) {
    return this.db
      .selectFrom('driver_advances')
      .select(['id', 'amount'])
      .where('master_trip_id', '=', masterTripId)
      .where('status', '=', 'issued')
      .execute();
  }

  approvedExpenses(masterTripId: number) {
    return this.db
      .selectFrom('driver_expenses')
      .select(['id', 'amount'])
      .where('master_trip_id', '=', masterTripId)
      .where('status', '=', 'approved')
      .execute();
  }

  async createSettlement(input: DriverSettlementCreateInput) {
    const insert: Insertable<EMSDB['driver_settlements']> = {
      settlement_number: input.settlementNumber,
      master_trip_id: input.masterTripId,
      driver_id: input.driverId,
      total_advance_amount: input.totalAdvanceAmount,
      total_approved_expense_amount: input.totalApprovedExpenseAmount,
      payable_to_driver_amount: input.payableToDriverAmount,
      recoverable_from_driver_amount: input.recoverableFromDriverAmount,
      status: input.status,
      created_by_user_id: input.createdByUserId,
    };
    const row = await this.db.insertInto('driver_settlements').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async updateSettlement(settlementId: number, input: DriverSettlementUpdateInput) {
    const patch: Updateable<EMSDB['driver_settlements']> = { updated_at: new Date() };
    if (input.totalAdvanceAmount !== undefined) patch.total_advance_amount = input.totalAdvanceAmount;
    if (input.totalApprovedExpenseAmount !== undefined) patch.total_approved_expense_amount = input.totalApprovedExpenseAmount;
    if (input.payableToDriverAmount !== undefined) patch.payable_to_driver_amount = input.payableToDriverAmount;
    if (input.recoverableFromDriverAmount !== undefined) patch.recoverable_from_driver_amount = input.recoverableFromDriverAmount;
    if (input.status !== undefined) patch.status = input.status;
    if (input.finalizedAt !== undefined) patch.finalized_at = input.finalizedAt;
    if (input.paidAt !== undefined) patch.paid_at = input.paidAt;
    if (input.cancelledReason !== undefined) patch.cancelled_reason = input.cancelledReason;
    if (input.finalizedByUserId !== undefined) patch.finalized_by_user_id = input.finalizedByUserId;
    if (input.paidByUserId !== undefined) patch.paid_by_user_id = input.paidByUserId;
    await this.db.updateTable('driver_settlements').set(patch).where('id', '=', settlementId).executeTakeFirst();
    return this.findById(settlementId);
  }

  listExpenses(masterTripId?: number, driverId?: number) {
    return this.expenseSelect()
      .$if(Boolean(masterTripId), (qb) => qb.where('driver_expenses.master_trip_id', '=', masterTripId!))
      .$if(Boolean(driverId), (qb) => qb.where('driver_expenses.driver_id', '=', driverId!))
      .orderBy('driver_expenses.created_at', 'desc')
      .execute();
  }

  findExpenseById(expenseId: number) {
    return this.expenseSelect().where('driver_expenses.id', '=', expenseId).executeTakeFirst();
  }

  async createExpense(input: DriverExpenseCreateInput) {
    const insert: Insertable<EMSDB['driver_expenses']> = {
      master_trip_id: input.masterTripId,
      driver_id: input.driverId,
      expense_type: input.expenseType,
      amount: input.amount,
      description: input.description,
      incurred_at: input.incurredAt,
      status: 'submitted',
    };
    const row = await this.db.insertInto('driver_expenses').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findExpenseById(row.id);
  }

  async updateExpense(expenseId: number, input: DriverExpenseUpdateInput) {
    const patch: Updateable<EMSDB['driver_expenses']> = { updated_at: new Date() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.approvedByUserId !== undefined) patch.approved_by_user_id = input.approvedByUserId;
    if (input.approvedAt !== undefined) patch.approved_at = input.approvedAt;
    if (input.rejectReason !== undefined) patch.reject_reason = input.rejectReason;
    await this.db.updateTable('driver_expenses').set(patch).where('id', '=', expenseId).executeTakeFirst();
    return this.findExpenseById(expenseId);
  }
}
