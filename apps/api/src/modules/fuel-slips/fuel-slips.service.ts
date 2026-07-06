import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateFuelSlipRequest, RejectFuelSlipRequest } from '@ems/api-contract';
import { FuelSlipStatus, FuelType } from '@ems/shared';
import { optionalDate, optionalDecimal, optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toFuelSlipResponse, toFuelSlipsListResponse } from './fuel-slips.mapper';
import { FuelSlipsRepository } from './fuel-slips.repository';

const FUEL_TYPES = new Set<string>(Object.values(FuelType));
const SLIP_STATUSES = new Set<string>(Object.values(FuelSlipStatus));

@Injectable()
export class FuelSlipsService {
  constructor(private readonly repo: FuelSlipsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const status = optionalString(query.status) ?? undefined;
    if (status && !SLIP_STATUSES.has(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid fuel slip status' } });
    }
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status,
      vendorId: optionalPositiveInt(query.vendorId, 'vendorId'),
      masterTripId: optionalPositiveInt(query.masterTripId, 'masterTripId'),
      vehicleId: optionalPositiveInt(query.vehicleId, 'vehicleId'),
      driverId: optionalPositiveInt(query.driverId, 'driverId'),
    };
    const [rows, total] = await Promise.all([this.repo.findAll(filters, p.offset, p.limit), this.repo.count(filters)]);
    return toFuelSlipsListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'fuelSlipId'));
    if (!row) throw this.notFound();
    return toFuelSlipResponse(row);
  }

  async create(body: CreateFuelSlipRequest) {
    const fuelVendorId = positiveInt(body.fuelVendorId, 'fuelVendorId');
    const vendor = await this.repo.vendorById(fuelVendorId);
    if (!vendor) throw new BadRequestException({ error: { code: 'FUEL_VENDOR_NOT_FOUND', message: 'Fuel vendor does not exist' } });
    if (!vendor.isActive) throw new BadRequestException({ error: { code: 'FUEL_VENDOR_INACTIVE', message: 'Fuel vendor is inactive' } });

    const masterTripIdFromBody = optionalPositiveInt(body.masterTripId, 'masterTripId') ?? null;
    const tripLegId = optionalPositiveInt(body.tripLegId, 'tripLegId') ?? null;
    if (masterTripIdFromBody === null && tripLegId === null) {
      throw new BadRequestException({ error: { code: 'TRIP_CONTEXT_REQUIRED', message: 'masterTripId or tripLegId is required' } });
    }

    let masterTripId = masterTripIdFromBody;
    let vehicleId = optionalPositiveInt(body.vehicleId, 'vehicleId') ?? null;
    let driverId = optionalPositiveInt(body.driverId, 'driverId') ?? null;

    if (tripLegId !== null) {
      const leg = await this.repo.tripLegById(tripLegId);
      if (!leg) throw new BadRequestException({ error: { code: 'TRIP_LEG_NOT_FOUND', message: 'Trip leg does not exist' } });
      if (masterTripId !== null && masterTripId !== leg.masterTripId) {
        throw new BadRequestException({ error: { code: 'TRIP_CONTEXT_MISMATCH', message: 'Trip leg does not belong to selected master trip' } });
      }
      masterTripId = leg.masterTripId;
      vehicleId = vehicleId ?? leg.vehicleId;
      driverId = driverId ?? leg.driverId;
    }

    if (masterTripId !== null) {
      const trip = await this.repo.masterTripById(masterTripId);
      if (!trip) throw new BadRequestException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip does not exist' } });
      vehicleId = vehicleId ?? trip.vehicleId;
      driverId = driverId ?? trip.driverId;
    }

    if (vehicleId === null || driverId === null) {
      throw new BadRequestException({ error: { code: 'VEHICLE_DRIVER_REQUIRED', message: 'vehicleId and driverId are required when trip context cannot provide them' } });
    }

    const fuelType = requiredString(body.fuelType ?? FuelType.DIESEL, 'fuelType');
    if (!FUEL_TYPES.has(fuelType)) throw new BadRequestException({ error: { code: 'INVALID_FUEL_TYPE', message: 'Invalid fuel type' } });
    const liters = optionalDecimal(body.liters, 'liters');
    const pricePerLiter = optionalDecimal(body.pricePerLiter, 'pricePerLiter');
    if (liters === null || Number(liters) <= 0) throw new BadRequestException({ error: { code: 'INVALID_LITERS', message: 'liters must be greater than zero' } });
    if (pricePerLiter === null) throw new BadRequestException({ error: { code: 'INVALID_PRICE', message: 'pricePerLiter is required' } });
    const totalAmount = String(Number(liters) * Number(pricePerLiter));
    const slipNumber = await this.generateSlipNumber();

    const row = await this.repo.create({
      slipNumber,
      fuelVendorId,
      masterTripId,
      tripLegId,
      vehicleId,
      driverId,
      fuelType,
      liters,
      pricePerLiter,
      totalAmount,
      slipDate: optionalDate(body.slipDate, 'slipDate') ?? new Date().toISOString().slice(0, 10),
      odometerReading: optionalDecimal(body.odometerReading, 'odometerReading'),
      stationName: optionalString(body.stationName),
      notes: optionalString(body.notes),
    });
    return toFuelSlipResponse(row!);
  }

  async verify(idValue: unknown, body: Record<string, unknown>) {
    const id = positiveInt(idValue, 'fuelSlipId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();
    if (existing.status !== FuelSlipStatus.PENDING) throw new BadRequestException({ error: { code: 'INVALID_FUEL_SLIP_STATUS', message: 'Only pending slips can be verified' } });
    const row = await this.repo.update(id, { status: FuelSlipStatus.VERIFIED, verifiedAt: new Date(), verifiedByUserId: optionalPositiveInt(body.verifiedByUserId, 'verifiedByUserId') ?? null, rejectedReason: null });
    return toFuelSlipResponse(row!);
  }

  async reject(idValue: unknown, body: RejectFuelSlipRequest) {
    const id = positiveInt(idValue, 'fuelSlipId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();
    if (existing.status !== FuelSlipStatus.PENDING) throw new BadRequestException({ error: { code: 'INVALID_FUEL_SLIP_STATUS', message: 'Only pending slips can be rejected' } });
    const row = await this.repo.update(id, { status: FuelSlipStatus.REJECTED, rejectedReason: requiredString(body.reason, 'reason'), verifiedAt: null, verifiedByUserId: null });
    return toFuelSlipResponse(row!);
  }

  private async generateSlipNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `FSL-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findBySlipNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'FUEL_SLIP_NUMBER_FAILED', message: 'Could not generate unique fuel slip number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'FUEL_SLIP_NOT_FOUND', message: 'Fuel slip not found' } });
  }
}
