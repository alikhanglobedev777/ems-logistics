import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, DeliveryGoodsCondition } from '@ems/shared';
import { optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toDeliveryProofResponse, toDeliveryProofsListResponse } from './delivery-proofs.mapper';
import { DeliveryProofsRepository } from './delivery-proofs.repository';

const GOODS_CONDITIONS = new Set<string>(Object.values(DeliveryGoodsCondition));

type CreateDeliveryProofRequest = {
  bookingId?: unknown;
  masterTripId?: unknown;
  tripLegId?: unknown;
  receiverName?: unknown;
  receiverPhone?: unknown;
  receiverCnic?: unknown;
  goodsCondition?: unknown;
  remarks?: unknown;
  proofImageUrls?: unknown;
  deliveredAt?: unknown;
  createdByUserId?: unknown;
};

@Injectable()
export class DeliveryProofsService {
  constructor(private readonly repo: DeliveryProofsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      bookingId: optionalPositiveInt(query.bookingId, 'bookingId'),
      tripLegId: optionalPositiveInt(query.tripLegId, 'tripLegId'),
    };
    const [rows, total] = await Promise.all([this.repo.findAll(filters, p.offset, p.limit), this.repo.count(filters)]);
    return toDeliveryProofsListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'deliveryProofId'));
    if (!row) throw this.notFound();
    return toDeliveryProofResponse(row);
  }

  async create(body: CreateDeliveryProofRequest) {
    const bookingId = positiveInt(body.bookingId, 'bookingId');
    const booking = await this.repo.bookingById(bookingId);
    if (!booking) throw new BadRequestException({ error: { code: 'BOOKING_NOT_FOUND', message: 'Booking does not exist' } });
    if (!([BookingStatus.IN_TRANSIT, BookingStatus.DELIVERED] as string[]).includes(booking.status)) {
      throw new BadRequestException({ error: { code: 'BOOKING_NOT_DELIVERABLE', message: 'POD can be uploaded only after dispatch or leg completion' } });
    }
    if (await this.repo.findByBookingId(bookingId)) {
      throw new BadRequestException({ error: { code: 'POD_ALREADY_EXISTS', message: 'Delivery proof already exists for this booking' } });
    }

    const tripLegId = optionalPositiveInt(body.tripLegId, 'tripLegId') ?? null;
    let masterTripId = optionalPositiveInt(body.masterTripId, 'masterTripId') ?? null;
    if (tripLegId !== null) {
      const context = await this.repo.tripLegContext(tripLegId);
      if (!context) throw new BadRequestException({ error: { code: 'TRIP_LEG_NOT_FOUND', message: 'Trip leg does not exist' } });
      if (masterTripId !== null && masterTripId !== context.masterTripId) {
        throw new BadRequestException({ error: { code: 'TRIP_CONTEXT_MISMATCH', message: 'Trip leg does not belong to selected master trip' } });
      }
      masterTripId = context.masterTripId;
    }

    const goodsCondition = requiredString(body.goodsCondition ?? DeliveryGoodsCondition.GOOD, 'goodsCondition');
    if (!GOODS_CONDITIONS.has(goodsCondition)) {
      throw new BadRequestException({ error: { code: 'INVALID_GOODS_CONDITION', message: 'goodsCondition is invalid' } });
    }

    const deliveredAtDate = parseDateTime(body.deliveredAt, 'deliveredAt') ?? new Date();
    const row = await this.repo.create({
      proofNumber: await this.generateProofNumber(),
      bookingId,
      masterTripId,
      tripLegId,
      receiverName: requiredString(body.receiverName, 'receiverName'),
      receiverPhone: optionalString(body.receiverPhone),
      receiverCnic: optionalString(body.receiverCnic),
      goodsCondition,
      remarks: optionalString(body.remarks),
      proofImageUrls: parseStringArray(body.proofImageUrls, 'proofImageUrls'),
      deliveredAt: deliveredAtDate,
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
    });
    return toDeliveryProofResponse(row!);
  }

  private async generateProofNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `POD-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'POD_NUMBER_FAILED', message: 'Could not generate unique POD number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'DELIVERY_PROOF_NOT_FOUND', message: 'Delivery proof not found' } });
  }
}

function parseDateTime(value: unknown, fieldName: string): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException({ error: { code: 'INVALID_DATETIME', message: `${fieldName} must be an ISO date-time string` } });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException({ error: { code: 'INVALID_DATETIME', message: `${fieldName} is invalid` } });
  }
  return date;
}

function parseStringArray(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new BadRequestException({ error: { code: 'INVALID_STRING_ARRAY', message: `${fieldName} must be an array of strings` } });
  }
  return value.map((item) => item.trim()).filter(Boolean);
}
