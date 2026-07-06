import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AgentCommissionStatus, BookingStatus, CommissionType } from '@ems/shared';
import { optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toAgentCommissionResponse, toAgentCommissionsListResponse } from './agent-commissions.mapper';
import { AgentCommissionsRepository } from './agent-commissions.repository';

const COMMISSION_STATUSES = new Set<string>(Object.values(AgentCommissionStatus));
const PAYABLE_AFTER = new Set(['delivery', 'customer_invoice', 'customer_payment']);

type CreateAgentCommissionRequest = { bookingId?: unknown; payableAfter?: unknown; notes?: unknown; createdByUserId?: unknown };

@Injectable()
export class AgentCommissionsService {
  constructor(private readonly repo: AgentCommissionsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const status = optionalString(query.status) ?? undefined;
    if (status && !COMMISSION_STATUSES.has(status)) throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid commission status' } });
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status,
      agentId: optionalPositiveInt(query.agentId, 'agentId'),
      bookingId: optionalPositiveInt(query.bookingId, 'bookingId'),
    };
    const [rows, total] = await Promise.all([this.repo.findAll(filters, p.offset, p.limit), this.repo.count(filters)]);
    return toAgentCommissionsListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'agentCommissionId'));
    if (!row) throw this.notFound();
    return toAgentCommissionResponse(row);
  }

  async create(body: CreateAgentCommissionRequest) {
    const bookingId = positiveInt(body.bookingId, 'bookingId');
    const booking = await this.repo.bookingForCommission(bookingId);
    if (!booking) throw new BadRequestException({ error: { code: 'BOOKING_NOT_FOUND', message: 'Booking does not exist' } });
    if (booking.agentId === null) throw new BadRequestException({ error: { code: 'BOOKING_HAS_NO_AGENT', message: 'Booking has no agent commission' } });
    if (!(await this.isEligibleBookingStatus(booking.status))) {
      throw new BadRequestException({ error: { code: 'BOOKING_NOT_READY_FOR_COMMISSION', message: 'Commission can be created after POD, invoice, or payment' } });
    }
    if (await this.repo.findByBookingId(bookingId)) {
      throw new BadRequestException({ error: { code: 'COMMISSION_ALREADY_EXISTS', message: 'Commission already exists for this booking' } });
    }
    const commissionType = booking.commissionType ?? CommissionType.MANUAL;
    const commissionValue = booking.commissionValue === null ? null : String(booking.commissionValue);
    const commissionAmount = calculateCommission(commissionType, commissionValue, Number(booking.finalFreightRate));
    const payableAfter = requiredString(body.payableAfter ?? 'customer_payment', 'payableAfter');
    if (!PAYABLE_AFTER.has(payableAfter)) throw new BadRequestException({ error: { code: 'INVALID_PAYABLE_AFTER', message: 'payableAfter is invalid' } });
    const row = await this.repo.create({
      commissionNumber: await this.generateCommissionNumber(),
      bookingId,
      agentId: booking.agentId,
      commissionType,
      commissionValue,
      commissionAmount: money(commissionAmount),
      payableAfter,
      notes: optionalString(body.notes),
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
    });
    return toAgentCommissionResponse(row!);
  }

  async approve(idValue: unknown, body: Record<string, unknown>) {
    const id = positiveInt(idValue, 'agentCommissionId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();
    if (existing.status !== AgentCommissionStatus.PENDING) throw new BadRequestException({ error: { code: 'COMMISSION_NOT_APPROVABLE', message: 'Only pending commissions can be approved' } });
    return toAgentCommissionResponse((await this.repo.update(id, { status: AgentCommissionStatus.APPROVED, approvedAt: new Date(), approvedByUserId: optionalPositiveInt(body.approvedByUserId, 'approvedByUserId') ?? null }))!);
  }

  async markPaid(idValue: unknown, body: Record<string, unknown>) {
    const id = positiveInt(idValue, 'agentCommissionId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();
    if (existing.status !== AgentCommissionStatus.APPROVED) throw new BadRequestException({ error: { code: 'COMMISSION_NOT_PAYABLE', message: 'Only approved commissions can be paid' } });
    return toAgentCommissionResponse((await this.repo.update(id, { status: AgentCommissionStatus.PAID, paidAt: new Date(), paidByUserId: optionalPositiveInt(body.paidByUserId, 'paidByUserId') ?? null }))!);
  }

  async cancel(idValue: unknown, body: Record<string, unknown>) {
    const id = positiveInt(idValue, 'agentCommissionId');
    if (!(await this.repo.findById(id))) throw this.notFound();
    return toAgentCommissionResponse((await this.repo.update(id, { status: AgentCommissionStatus.CANCELLED, cancelledReason: requiredString(body.reason, 'reason') }))!);
  }

  private async isEligibleBookingStatus(status: string) {
    return status === BookingStatus.POD_UPLOADED || status === BookingStatus.INVOICED || status === BookingStatus.PAID;
  }

  private async generateCommissionNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `ACOM-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'AGENT_COMMISSION_NUMBER_FAILED', message: 'Could not generate commission number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'AGENT_COMMISSION_NOT_FOUND', message: 'Agent commission not found' } });
  }
}

function calculateCommission(type: string, value: string | null, finalFreightRate: number) {
  const amount = value === null ? 0 : Number(value);
  if (type === CommissionType.PERCENTAGE) return finalFreightRate * (amount / 100);
  if (type === CommissionType.FIXED || type === CommissionType.MANUAL) return amount;
  return 0;
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
