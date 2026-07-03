import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDriverExpenseRequest, CreateDriverSettlementRequest } from '@ems/api-contract';
import { DriverExpenseStatus, DriverSettlementStatus } from '@ems/shared';
import { optionalDate, optionalDecimal, optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import {
  toDriverExpenseResponse,
  toDriverSettlementResponse,
  toDriverSettlementsListResponse,
} from './driver-settlements.mapper';
import { DriverSettlementsRepository } from './driver-settlements.repository';

const SETTLEMENT_STATUSES = new Set<string>(Object.values(DriverSettlementStatus));
const EXPENSE_TYPES = new Set(['toll_tax', 'loading_unloading', 'repair_emergency', 'parking', 'other']);

@Injectable()
export class DriverSettlementsService {
  constructor(private readonly repo: DriverSettlementsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status: query.status === undefined ? undefined : this.parseSettlementStatus(query.status),
      masterTripId: optionalPositiveInt(query.masterTripId, 'masterTripId'),
      driverId: optionalPositiveInt(query.driverId, 'driverId'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toDriverSettlementsListResponse(rows, p.page, p.limit, total);
  }

  async get(settlementIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(settlementIdValue, 'settlementId'));
    if (!row) throw this.notFound();
    return toDriverSettlementResponse(row);
  }

  async create(body: CreateDriverSettlementRequest) {
    const masterTripId = positiveInt(body.masterTripId, 'masterTripId');
    const trip = await this.repo.masterTripById(masterTripId);
    if (!trip) throw new BadRequestException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip does not exist' } });
    if (await this.repo.findByMasterTrip(masterTripId)) {
      throw new BadRequestException({ error: { code: 'SETTLEMENT_EXISTS', message: 'Settlement already exists for this master trip' } });
    }
    const totals = await this.calculateTotals(masterTripId);
    const row = await this.repo.createSettlement({
      settlementNumber: await this.generateSettlementNumber(),
      masterTripId,
      driverId: trip.driverId,
      ...totals,
      status: DriverSettlementStatus.OPEN,
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
    });
    return toDriverSettlementResponse(row!);
  }

  async finalize(settlementIdValue: unknown, body: Record<string, unknown>) {
    const settlementId = positiveInt(settlementIdValue, 'settlementId');
    const existing = await this.repo.findById(settlementId);
    if (!existing) throw this.notFound();
    if (existing.status !== DriverSettlementStatus.OPEN) {
      throw new BadRequestException({ error: { code: 'INVALID_SETTLEMENT_STATUS', message: 'Only open settlements can be finalized' } });
    }
    const totals = await this.calculateTotals(existing.masterTripId);
    const row = await this.repo.updateSettlement(settlementId, {
      ...totals,
      status: DriverSettlementStatus.UNDER_REVIEW,
      finalizedAt: new Date(),
      finalizedByUserId: optionalPositiveInt(body.finalizedByUserId, 'finalizedByUserId') ?? null,
    });
    return toDriverSettlementResponse(row!);
  }

  async markPaid(settlementIdValue: unknown, body: Record<string, unknown>) {
    const settlementId = positiveInt(settlementIdValue, 'settlementId');
    const existing = await this.repo.findById(settlementId);
    if (!existing) throw this.notFound();
    if (existing.status !== DriverSettlementStatus.UNDER_REVIEW) {
      throw new BadRequestException({ error: { code: 'INVALID_SETTLEMENT_STATUS', message: 'Only finalized settlements can be marked paid' } });
    }
    const row = await this.repo.updateSettlement(settlementId, {
      status: DriverSettlementStatus.SETTLED,
      paidAt: new Date(),
      paidByUserId: optionalPositiveInt(body.paidByUserId, 'paidByUserId') ?? null,
    });
    return toDriverSettlementResponse(row!);
  }

  async cancel(settlementIdValue: unknown, body: Record<string, unknown>) {
    const settlementId = positiveInt(settlementIdValue, 'settlementId');
    const existing = await this.repo.findById(settlementId);
    if (!existing) throw this.notFound();
    if (existing.status === DriverSettlementStatus.SETTLED) {
      throw new BadRequestException({ error: { code: 'SETTLEMENT_LOCKED', message: 'Settled driver settlement cannot be cancelled' } });
    }
    const row = await this.repo.updateSettlement(settlementId, {
      status: DriverSettlementStatus.CANCELLED,
      cancelledReason: requiredString(body.reason, 'reason'),
    });
    return toDriverSettlementResponse(row!);
  }

  async listExpenses(query: Record<string, unknown>) {
    const rows = await this.repo.listExpenses(
      optionalPositiveInt(query.masterTripId, 'masterTripId'),
      optionalPositiveInt(query.driverId, 'driverId'),
    );
    return { data: rows.map((row) => toDriverExpenseResponse(row).data), message: 'Success' };
  }

  async createExpense(body: CreateDriverExpenseRequest) {
    const masterTripId = positiveInt(body.masterTripId, 'masterTripId');
    const trip = await this.repo.masterTripById(masterTripId);
    if (!trip) throw new BadRequestException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip does not exist' } });
    const expenseType = this.parseExpenseType(body.expenseType ?? 'other');
    const amount = optionalDecimal(body.amount, 'amount');
    if (amount === null || Number(amount) <= 0) {
      throw new BadRequestException({ error: { code: 'INVALID_AMOUNT', message: 'Expense amount must be greater than zero' } });
    }
    const row = await this.repo.createExpense({
      masterTripId,
      driverId: trip.driverId,
      expenseType,
      amount,
      description: optionalString(body.description),
      incurredAt: optionalDate(body.incurredAt, 'incurredAt') ?? new Date().toISOString().slice(0, 10),
    });
    return toDriverExpenseResponse(row!);
  }

  async approveExpense(expenseIdValue: unknown, body: Record<string, unknown>) {
    const expenseId = positiveInt(expenseIdValue, 'expenseId');
    const existing = await this.repo.findExpenseById(expenseId);
    if (!existing) throw new NotFoundException({ error: { code: 'DRIVER_EXPENSE_NOT_FOUND', message: 'Driver expense not found' } });
    if (existing.status !== DriverExpenseStatus.SUBMITTED) {
      throw new BadRequestException({ error: { code: 'INVALID_EXPENSE_STATUS', message: 'Only submitted expenses can be approved' } });
    }
    const row = await this.repo.updateExpense(expenseId, {
      status: DriverExpenseStatus.APPROVED,
      approvedAt: new Date(),
      approvedByUserId: optionalPositiveInt(body.approvedByUserId, 'approvedByUserId') ?? null,
    });
    return toDriverExpenseResponse(row!);
  }

  async rejectExpense(expenseIdValue: unknown, body: Record<string, unknown>) {
    const expenseId = positiveInt(expenseIdValue, 'expenseId');
    const existing = await this.repo.findExpenseById(expenseId);
    if (!existing) throw new NotFoundException({ error: { code: 'DRIVER_EXPENSE_NOT_FOUND', message: 'Driver expense not found' } });
    if (existing.status !== DriverExpenseStatus.SUBMITTED) {
      throw new BadRequestException({ error: { code: 'INVALID_EXPENSE_STATUS', message: 'Only submitted expenses can be rejected' } });
    }
    const row = await this.repo.updateExpense(expenseId, {
      status: DriverExpenseStatus.REJECTED,
      rejectReason: requiredString(body.reason, 'reason'),
    });
    return toDriverExpenseResponse(row!);
  }

  private async calculateTotals(masterTripId: number) {
    const [advances, expenses] = await Promise.all([
      this.repo.issuedAdvances(masterTripId),
      this.repo.approvedExpenses(masterTripId),
    ]);
    const totalAdvanceAmountNumber = advances.reduce((sum, row) => sum + Number(row.amount), 0);
    const totalApprovedExpenseAmountNumber = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
    const payableToDriverAmountNumber = Math.max(0, totalApprovedExpenseAmountNumber - totalAdvanceAmountNumber);
    const recoverableFromDriverAmountNumber = Math.max(0, totalAdvanceAmountNumber - totalApprovedExpenseAmountNumber);
    return {
      totalAdvanceAmount: money(totalAdvanceAmountNumber),
      totalApprovedExpenseAmount: money(totalApprovedExpenseAmountNumber),
      payableToDriverAmount: money(payableToDriverAmountNumber),
      recoverableFromDriverAmount: money(recoverableFromDriverAmountNumber),
    };
  }

  private parseSettlementStatus(value: unknown) {
    const status = requiredString(value, 'status');
    if (!SETTLEMENT_STATUSES.has(status)) throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid settlement status' } });
    return status;
  }

  private parseExpenseType(value: unknown) {
    const parsed = requiredString(value, 'expenseType');
    if (!EXPENSE_TYPES.has(parsed)) throw new BadRequestException({ error: { code: 'INVALID_EXPENSE_TYPE', message: 'Fuel expense is not allowed here; fuel is vendor payable' } });
    return parsed;
  }

  private async generateSettlementNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `SET-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findBySettlementNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'SETTLEMENT_NUMBER_FAILED', message: 'Could not generate unique settlement number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'DRIVER_SETTLEMENT_NOT_FOUND', message: 'Driver settlement not found' } });
  }
}

function money(value: number) {
  return value.toFixed(2);
}
