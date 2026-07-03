import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBookingRequest, UpdateBookingRequest } from '@ems/api-contract';
import { BookingStatus, CommissionType, FuelType } from '@ems/shared';
import {
  optionalDate,
  optionalDecimal,
  optionalPositiveInt,
  optionalString,
  pagination,
  positiveInt,
  requiredString,
} from '../../common/utils/master-data.utils';
import {
  toBookingPricingSnapshotResponse,
  toBookingResponse,
  toBookingsListResponse,
} from './bookings.mapper';
import { BookingsRepository, type BookingPricingSnapshotInput } from './bookings.repository';

const BOOKING_STATUSES = new Set<string>(Object.values(BookingStatus));
const DEFAULT_SPOT_MARGIN_PERCENT = 15;

@Injectable()
export class BookingsService {
  constructor(private readonly repo: BookingsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status: query.status === undefined ? undefined : this.parseStatus(query.status),
      customerId: optionalPositiveInt(query.customerId, 'customerId'),
      routeId: optionalPositiveInt(query.routeId, 'routeId'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toBookingsListResponse(rows, p.page, p.limit, total);
  }

  async get(bookingIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(bookingIdValue, 'bookingId'));
    if (!row) throw this.notFound();
    return toBookingResponse(row);
  }

  async create(body: CreateBookingRequest) {
    const customerId = positiveInt(body.customerId, 'customerId');
    const originStationId = positiveInt(body.originStationId, 'originStationId');
    const destinationStationId = positiveInt(body.destinationStationId, 'destinationStationId');
    const requiredVehicleTypeId = positiveInt(body.requiredVehicleTypeId, 'requiredVehicleTypeId');
    const agentId = optionalPositiveInt(body.agentId, 'agentId') ?? null;
    const createdByUserId = optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null;

    const route = await this.resolveRoute(body.routeId, originStationId, destinationStationId);
    await this.assertReferences(customerId, agentId, originStationId, destinationStationId, requiredVehicleTypeId);

    const pickupDate = optionalDate(body.pickupDate, 'pickupDate');
    const deliveryDueDate = optionalDate(body.deliveryDueDate, 'deliveryDueDate');
    if (pickupDate && deliveryDueDate && new Date(`${deliveryDueDate}T00:00:00Z`) < new Date(`${pickupDate}T00:00:00Z`)) {
      throw new BadRequestException({ error: { code: 'INVALID_BOOKING_DATES', message: 'deliveryDueDate must be on or after pickupDate' } });
    }

    const pricing = await this.calculatePricing(customerId, route.id, requiredVehicleTypeId, agentId, body.finalFreightRate);
    const taxAmount = pricing.taxAmount;
    const totalCustomerAmount = pricing.finalFreightRate + taxAmount;
    const status = body.status === undefined ? BookingStatus.DRAFT : this.parseStatus(body.status);

    const bookingNumber = await this.generateBookingNumber();
    const items = (body.items ?? []).map((item) => ({
      description: requiredString(item.description, 'item.description'),
      quantity: optionalDecimal(item.quantity ?? 1, 'item.quantity') ?? '1',
      weightTons: optionalDecimal(item.weightTons, 'item.weightTons'),
      unit: optionalString(item.unit),
    }));

    const row = await this.repo.create(
      {
        bookingNumber,
        customerId,
        contractId: pricing.contractId,
        agentId,
        originStationId,
        destinationStationId,
        routeId: route.id,
        requiredVehicleTypeId,
        status,
        cargoDescription: requiredString(body.cargoDescription, 'cargoDescription'),
        cargoWeightTons: optionalDecimal(body.cargoWeightTons, 'cargoWeightTons'),
        quantity: optionalDecimal(body.quantity, 'quantity'),
        pickupDate,
        deliveryDueDate,
        finalFreightRate: money(pricing.finalFreightRate),
        taxAmount: money(taxAmount),
        totalCustomerAmount: money(totalCustomerAmount),
        requiresRateApproval: pricing.requiresRateApproval,
        createdByUserId,
      },
      pricing.snapshot,
      items,
    );

    return toBookingResponse(row!);
  }

  async update(bookingIdValue: unknown, body: UpdateBookingRequest) {
    const bookingId = positiveInt(bookingIdValue, 'bookingId');
    const existing = await this.repo.findById(bookingId);
    if (!existing) throw this.notFound();
    if (existing.status !== BookingStatus.DRAFT) {
      throw new BadRequestException({ error: { code: 'BOOKING_LOCKED', message: 'Only draft bookings can be edited' } });
    }

    const row = await this.repo.update(bookingId, {
      cargoDescription: body.cargoDescription === undefined ? undefined : requiredString(body.cargoDescription, 'cargoDescription'),
      cargoWeightTons: body.cargoWeightTons === undefined ? undefined : optionalDecimal(body.cargoWeightTons, 'cargoWeightTons'),
      quantity: body.quantity === undefined ? undefined : optionalDecimal(body.quantity, 'quantity'),
      pickupDate: body.pickupDate === undefined ? undefined : optionalDate(body.pickupDate, 'pickupDate'),
      deliveryDueDate: body.deliveryDueDate === undefined ? undefined : optionalDate(body.deliveryDueDate, 'deliveryDueDate'),
      status: body.status === undefined ? undefined : this.parseStatus(body.status),
    });
    return toBookingResponse(row!);
  }

  async confirm(bookingIdValue: unknown) {
    const bookingId = positiveInt(bookingIdValue, 'bookingId');
    const existing = await this.repo.findById(bookingId);
    if (!existing) throw this.notFound();
    if (existing.status !== BookingStatus.DRAFT) {
      throw new BadRequestException({ error: { code: 'INVALID_BOOKING_STATUS', message: 'Only draft bookings can be confirmed' } });
    }
    if (existing.requiresRateApproval && !existing.approvedAt) {
      throw new BadRequestException({ error: { code: 'RATE_APPROVAL_REQUIRED', message: 'Booking rate must be approved before confirmation' } });
    }
    return toBookingResponse((await this.repo.update(bookingId, { status: BookingStatus.CONFIRMED }))!);
  }

  async approveRate(bookingIdValue: unknown, body: Record<string, unknown>) {
    const bookingId = positiveInt(bookingIdValue, 'bookingId');
    if (!(await this.repo.findById(bookingId))) throw this.notFound();
    const approvedByUserId = optionalPositiveInt(body.approvedByUserId, 'approvedByUserId') ?? null;
    return toBookingResponse((await this.repo.update(bookingId, {
      requiresRateApproval: false,
      approvedByUserId,
      approvedAt: new Date(),
    }))!);
  }

  async cancel(bookingIdValue: unknown, body: Record<string, unknown>) {
    const bookingId = positiveInt(bookingIdValue, 'bookingId');
    if (!(await this.repo.findById(bookingId))) throw this.notFound();
    return toBookingResponse((await this.repo.update(bookingId, {
      status: BookingStatus.CANCELLED,
      cancelReason: requiredString(body.reason, 'reason'),
    }))!);
  }

  async pricingSnapshot(bookingIdValue: unknown) {
    const bookingId = positiveInt(bookingIdValue, 'bookingId');
    if (!(await this.repo.findById(bookingId))) throw this.notFound();
    const row = await this.repo.getPricingSnapshot(bookingId);
    if (!row) {
      throw new NotFoundException({ error: { code: 'PRICING_SNAPSHOT_NOT_FOUND', message: 'Pricing snapshot not found' } });
    }
    return toBookingPricingSnapshotResponse(row);
  }

  private async calculatePricing(
    customerId: number,
    routeId: number,
    vehicleTypeId: number,
    agentId: number | null,
    finalFreightRateValue: unknown,
  ) {
    const [fuelProfile, overheadProfile, fuelPrice, contractRate] = await Promise.all([
      this.repo.routeFuelProfile(routeId, vehicleTypeId),
      this.repo.routeOverheadProfile(routeId, vehicleTypeId),
      this.repo.latestFuelPrice(FuelType.DIESEL),
      this.repo.activeContractRate(customerId, routeId, vehicleTypeId, new Date()),
    ]);

    if (!fuelProfile || !overheadProfile || !fuelPrice) {
      throw new BadRequestException({ error: { code: 'PRICING_SETUP_MISSING', message: 'Route fuel, overhead, or fuel price setup is missing' } });
    }

    const expectedLiters = Number(fuelProfile.expectedLiters);
    const reserveLiters = Number(fuelProfile.reserveLiters);
    const fuelPricePerLiter = Number(fuelPrice.pricePerLiter);
    const estimatedFuelCost = (expectedLiters + reserveLiters) * fuelPricePerLiter;
    const internalOverheadCost = Number(overheadProfile.totalOverhead);

    const contractBase = contractRate
      ? Number(contractRate.baseFreightRate) + Number(contractRate.loadingCharges) + Number(contractRate.unloadingCharges)
      : null;
    const fuelAdjustment = contractRate?.fuelAdjustmentEnabled && contractRate.fuelBasePrice
      ? Math.max(0, fuelPricePerLiter - Number(contractRate.fuelBasePrice)) * expectedLiters
      : 0;
    const minimumMarginPercent = contractRate ? Number(contractRate.minimumMarginPercent) : DEFAULT_SPOT_MARGIN_PERCENT;

    const internalCost = estimatedFuelCost + internalOverheadCost;
    const spotSuggested = internalCost * (1 + minimumMarginPercent / 100);
    const suggestedFreightRate = contractBase === null ? spotSuggested : contractBase + fuelAdjustment;
    const finalFreightRate = optionalDecimal(finalFreightRateValue, 'finalFreightRate') === null
      ? suggestedFreightRate
      : Number(optionalDecimal(finalFreightRateValue, 'finalFreightRate'));

    const agentCommissionEstimate = await this.estimateAgentCommission(agentId, finalFreightRate);
    const estimatedMarginAmount = finalFreightRate - internalCost - agentCommissionEstimate;
    const estimatedMarginPercent = finalFreightRate > 0 ? (estimatedMarginAmount / finalFreightRate) * 100 : 0;
    const requiresRateApproval = estimatedMarginPercent < minimumMarginPercent;
    const taxPercent = contractRate ? Number(contractRate.taxPercent) : 0;

    const snapshot: BookingPricingSnapshotInput = {
      fuelPriceSnapshotId: fuelPrice.id,
      fuelPricePerLiter: money(fuelPricePerLiter),
      expectedLiters: money(expectedLiters),
      reserveLiters: money(reserveLiters),
      estimatedFuelCost: money(estimatedFuelCost),
      internalOverheadCost: money(internalOverheadCost),
      agentCommissionEstimate: money(agentCommissionEstimate),
      suggestedFreightRate: money(suggestedFreightRate),
      finalFreightRate: money(finalFreightRate),
      estimatedMarginAmount: money(estimatedMarginAmount),
      estimatedMarginPercent: money(estimatedMarginPercent),
      pricingSource: contractRate ? 'contract' : 'spot',
    };

    return {
      contractId: contractRate?.contractId ?? null,
      finalFreightRate,
      taxAmount: finalFreightRate * (taxPercent / 100),
      requiresRateApproval,
      snapshot,
    };
  }

  private async estimateAgentCommission(agentId: number | null, finalFreightRate: number) {
    if (!agentId) return 0;
    const agent = await this.repo.agentById(agentId);
    if (!agent) throw new BadRequestException({ error: { code: 'AGENT_NOT_FOUND', message: 'Agent does not exist' } });
    const value = agent.commissionValue === null ? 0 : Number(agent.commissionValue);
    if (agent.commissionType === CommissionType.PERCENTAGE) return finalFreightRate * (value / 100);
    if (agent.commissionType === CommissionType.FIXED) return value;
    return 0;
  }

  private async resolveRoute(routeIdValue: unknown, originStationId: number, destinationStationId: number) {
    if (originStationId === destinationStationId) {
      throw new BadRequestException({ error: { code: 'INVALID_ROUTE', message: 'Origin and destination stations must be different' } });
    }
    const routeId = optionalPositiveInt(routeIdValue, 'routeId');
    const route = routeId ? await this.repo.routeById(routeId) : await this.repo.routeByStations(originStationId, destinationStationId);
    if (!route) {
      throw new BadRequestException({ error: { code: 'ROUTE_NOT_FOUND', message: 'Active route does not exist for this booking' } });
    }
    if (route.originStationId !== originStationId || route.destinationStationId !== destinationStationId) {
      throw new BadRequestException({ error: { code: 'ROUTE_STATION_MISMATCH', message: 'Route does not match origin/destination stations' } });
    }
    return route;
  }

  private async assertReferences(customerId: number, agentId: number | null, originStationId: number, destinationStationId: number, vehicleTypeId: number) {
    const [customer, origin, destination, vehicleType] = await Promise.all([
      this.repo.customerExists(customerId),
      this.repo.stationExists(originStationId),
      this.repo.stationExists(destinationStationId),
      this.repo.vehicleTypeExists(vehicleTypeId),
    ]);
    if (!customer || !origin || !destination || !vehicleType) {
      throw new BadRequestException({ error: { code: 'REFERENCE_NOT_FOUND', message: 'Customer, station, or vehicle type does not exist' } });
    }
    if (agentId !== null && !(await this.repo.agentById(agentId))) {
      throw new BadRequestException({ error: { code: 'AGENT_NOT_FOUND', message: 'Agent does not exist' } });
    }
  }

  private parseStatus(value: unknown) {
    const status = requiredString(value, 'status');
    if (!BOOKING_STATUSES.has(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_BOOKING_STATUS', message: 'status is invalid' } });
    }
    return status;
  }

  private async generateBookingNumber() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const value = `BILTY-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      if (!(await this.repo.findByNumber(value))) return value;
    }
    throw new BadRequestException({ error: { code: 'BOOKING_NUMBER_FAILED', message: 'Could not generate booking number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } });
  }
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
