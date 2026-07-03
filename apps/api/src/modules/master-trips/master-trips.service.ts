import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateMasterTripRequest, CreateTripLegRequest } from '@ems/api-contract';
import { TripLegStatus, TripStatus, VehicleStatus } from '@ems/shared';
import {
  optionalDate,
  optionalPositiveInt,
  optionalString,
  pagination,
  positiveInt,
} from '../../common/utils/master-data.utils';
import { toMasterTripResponse, toMasterTripsListResponse, toTripTimelineResponse } from './master-trips.mapper';
import { MasterTripsRepository } from './master-trips.repository';

const TRIP_STATUSES = new Set<string>(Object.values(TripStatus));

@Injectable()
export class MasterTripsService {
  constructor(private readonly repo: MasterTripsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status: query.status === undefined ? undefined : this.parseTripStatus(query.status),
      vehicleId: optionalPositiveInt(query.vehicleId, 'vehicleId'),
      driverId: optionalPositiveInt(query.driverId, 'driverId'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toMasterTripsListResponse(rows, p.page, p.limit, total);
  }

  async get(masterTripIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(masterTripIdValue, 'masterTripId'));
    if (!row) throw this.notFound();
    return toMasterTripResponse(row);
  }

  async create(body: CreateMasterTripRequest) {
    const vehicleId = positiveInt(body.vehicleId, 'vehicleId');
    const driverId = positiveInt(body.driverId, 'driverId');
    const startStationId = positiveInt(body.startStationId, 'startStationId');
    const createdByUserId = optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null;
    const plannedStartAt = optionalDateTime(body.plannedStartAt, 'plannedStartAt');

    const [vehicle, driver, station] = await Promise.all([
      this.repo.vehicleById(vehicleId),
      this.repo.driverById(driverId),
      this.repo.stationById(startStationId),
    ]);
    if (!vehicle || !vehicle.isActive) throw new BadRequestException({ error: { code: 'VEHICLE_NOT_FOUND', message: 'Active vehicle does not exist' } });
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException({ error: { code: 'VEHICLE_NOT_AVAILABLE', message: 'Vehicle must be available to start a master trip' } });
    }
    if (!driver || !driver.isActive) throw new BadRequestException({ error: { code: 'DRIVER_NOT_FOUND', message: 'Active driver does not exist' } });
    if (!station || !station.isActive) throw new BadRequestException({ error: { code: 'STATION_NOT_FOUND', message: 'Active start station does not exist' } });
    if (vehicle.currentStationId !== startStationId) {
      throw new BadRequestException({ error: { code: 'VEHICLE_STATION_MISMATCH', message: 'Vehicle current station must match master trip start station' } });
    }

    const tripNumber = await this.generateTripNumber();
    const row = await this.repo.create({
      tripNumber,
      vehicleId,
      driverId,
      startStationId,
      currentStationId: startStationId,
      status: TripStatus.PLANNED,
      plannedStartAt,
      createdByUserId,
    });
    await this.repo.createEvent(row!.id, null, 'trip_created', 'Master trip created', startStationId, null, createdByUserId);
    return toMasterTripResponse(row!);
  }

  async addLeg(masterTripIdValue: unknown, body: CreateTripLegRequest) {
    const masterTripId = positiveInt(masterTripIdValue, 'masterTripId');
    const masterTrip = await this.repo.findById(masterTripId);
    if (!masterTrip) throw this.notFound();
    if (!([TripStatus.PLANNED, TripStatus.IN_TRANSIT] as TripStatus[]).includes(masterTrip.status as TripStatus)) {
      throw new BadRequestException({ error: { code: 'TRIP_LOCKED', message: 'Cannot add leg to completed or cancelled trip' } });
    }

    const routeId = positiveInt(body.routeId, 'routeId');
    const originStationId = positiveInt(body.originStationId, 'originStationId');
    const destinationStationId = positiveInt(body.destinationStationId, 'destinationStationId');
    const route = await this.repo.routeById(routeId);
    if (!route || !route.isActive) throw new BadRequestException({ error: { code: 'ROUTE_NOT_FOUND', message: 'Active route does not exist' } });
    if (route.originStationId !== originStationId || route.destinationStationId !== destinationStationId) {
      throw new BadRequestException({ error: { code: 'ROUTE_STATION_MISMATCH', message: 'Route does not match trip leg origin/destination' } });
    }

    const sequenceNo = body.sequenceNo === undefined ? await this.repo.nextSequenceNo(masterTripId) : positiveInt(body.sequenceNo, 'sequenceNo');
    const plannedDepartureAt = optionalDateTime(body.plannedDepartureAt, 'plannedDepartureAt');
    const legId = await this.repo.addLeg({
      masterTripId,
      sequenceNo,
      routeId,
      originStationId,
      destinationStationId,
      plannedDepartureAt,
      status: TripLegStatus.PLANNED,
    });
    return { data: { id: legId }, message: 'Success' };
  }

  async timeline(masterTripIdValue: unknown) {
    const masterTripId = positiveInt(masterTripIdValue, 'masterTripId');
    if (!(await this.repo.findById(masterTripId))) throw this.notFound();
    return toTripTimelineResponse(await this.repo.timeline(masterTripId));
  }

  private parseTripStatus(value: unknown) {
    if (typeof value !== 'string' || !TRIP_STATUSES.has(value)) {
      throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid trip status' } });
    }
    return value;
  }

  private async generateTripNumber() {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
    for (let index = 1; index <= 99_999; index += 1) {
      const candidate = `TRIP-${stamp}-${String(index).padStart(5, '0')}`;
      if (!(await this.repo.findByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'TRIP_NUMBER_EXHAUSTED', message: 'Could not generate trip number' } });
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip not found' } });
  }
}

function optionalDateTime(value: unknown, fieldName: string): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new BadRequestException({ error: { code: 'INVALID_DATETIME', message: `${fieldName} must be an ISO date-time` } });
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException({ error: { code: 'INVALID_DATETIME', message: `${fieldName} is invalid` } });
  return date;
}

