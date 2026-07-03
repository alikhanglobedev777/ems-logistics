import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDriverAdvanceRequest } from '@ems/api-contract';
import { DriverAdvanceStatus } from '@ems/shared';
import { optionalPositiveInt, optionalString, optionalDecimal, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toDriverAdvanceResponse, toDriverAdvancesListResponse } from './driver-advances.mapper';
import { DriverAdvancesRepository } from './driver-advances.repository';

const ADVANCE_STATUSES = new Set<string>(Object.values(DriverAdvanceStatus));
const ADVANCE_TYPES = new Set(['cash_trip_expense', 'toll_tax', 'loading_unloading', 'repair_emergency', 'other']);
const PAYMENT_METHODS = new Set(['cash', 'bank_transfer', 'mobile_wallet', 'cheque']);

@Injectable()
export class DriverAdvancesService {
  constructor(private readonly repo: DriverAdvancesRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status: query.status === undefined ? undefined : this.parseStatus(query.status),
      masterTripId: optionalPositiveInt(query.masterTripId, 'masterTripId'),
      driverId: optionalPositiveInt(query.driverId, 'driverId'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toDriverAdvancesListResponse(rows, p.page, p.limit, total);
  }

  async get(advanceIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(advanceIdValue, 'advanceId'));
    if (!row) throw this.notFound();
    return toDriverAdvanceResponse(row);
  }

  async create(body: CreateDriverAdvanceRequest) {
    const masterTripId = positiveInt(body.masterTripId, 'masterTripId');
    const trip = await this.repo.masterTripById(masterTripId);
    if (!trip) throw new BadRequestException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip does not exist' } });
    const advanceType = this.parseAdvanceType(body.advanceType ?? 'cash_trip_expense');
    const paymentMethod = this.parsePaymentMethod(body.paymentMethod ?? 'cash');
    const amount = optionalDecimal(body.amount, 'amount');
    if (amount === null || Number(amount) <= 0) {
      throw new BadRequestException({ error: { code: 'INVALID_AMOUNT', message: 'Advance amount must be greater than zero' } });
    }
    const advanceNumber = await this.generateAdvanceNumber();
    const row = await this.repo.create({
      advanceNumber,
      masterTripId,
      driverId: trip.driverId,
      advanceType,
      amount,
      paymentMethod,
      reason: optionalString(body.reason),
      status: DriverAdvanceStatus.DRAFT,
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
    });
    return toDriverAdvanceResponse(row!);
  }

  async issue(advanceIdValue: unknown, body: Record<string, unknown>) {
    const advanceId = positiveInt(advanceIdValue, 'advanceId');
    const existing = await this.repo.findById(advanceId);
    if (!existing) throw this.notFound();
    if (existing.status !== DriverAdvanceStatus.DRAFT) {
      throw new BadRequestException({ error: { code: 'INVALID_ADVANCE_STATUS', message: 'Only draft advances can be issued' } });
    }
    const row = await this.repo.update(advanceId, {
      status: DriverAdvanceStatus.ISSUED,
      issuedAt: new Date(),
      issuedByUserId: optionalPositiveInt(body.issuedByUserId, 'issuedByUserId') ?? null,
    });
    return toDriverAdvanceResponse(row!);
  }

  async cancel(advanceIdValue: unknown, body: Record<string, unknown>) {
    const advanceId = positiveInt(advanceIdValue, 'advanceId');
    const existing = await this.repo.findById(advanceId);
    if (!existing) throw this.notFound();
    if (!([DriverAdvanceStatus.DRAFT, DriverAdvanceStatus.ISSUED] as DriverAdvanceStatus[]).includes(existing.status as DriverAdvanceStatus)) {
      throw new BadRequestException({ error: { code: 'INVALID_ADVANCE_STATUS', message: 'Only draft or issued advances can be cancelled' } });
    }
    const row = await this.repo.update(advanceId, {
      status: DriverAdvanceStatus.CANCELLED,
      cancelledReason: requiredString(body.reason, 'reason'),
    });
    return toDriverAdvanceResponse(row!);
  }

  private parseStatus(value: unknown) {
    const status = requiredString(value, 'status');
    if (!ADVANCE_STATUSES.has(status)) throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid driver advance status' } });
    return status;
  }

  private parseAdvanceType(value: unknown) {
    const parsed = requiredString(value, 'advanceType');
    if (!ADVANCE_TYPES.has(parsed)) throw new BadRequestException({ error: { code: 'INVALID_ADVANCE_TYPE', message: 'Fuel advance is not allowed here; fuel is vendor payable' } });
    return parsed;
  }

  private parsePaymentMethod(value: unknown) {
    const parsed = requiredString(value, 'paymentMethod');
    if (!PAYMENT_METHODS.has(parsed)) throw new BadRequestException({ error: { code: 'INVALID_PAYMENT_METHOD', message: 'Invalid payment method' } });
    return parsed;
  }

  private async generateAdvanceNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `ADV-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findByAdvanceNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'ADVANCE_NUMBER_FAILED', message: 'Could not generate unique advance number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'DRIVER_ADVANCE_NOT_FOUND', message: 'Driver advance not found' } });
  }
}
