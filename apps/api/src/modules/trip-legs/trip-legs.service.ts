import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AssignBookingToTripLegRequest, EmergencyTripOverrideRequest } from '@ems/api-contract';
import { BookingStatus, TripLegStatus } from '@ems/shared';
import { optionalDecimal, optionalPositiveInt, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toTripLegResponse } from './trip-legs.mapper';
import { TripLegsRepository } from './trip-legs.repository';

@Injectable()
export class TripLegsService {
  constructor(private readonly repo: TripLegsRepository) {}

  async get(tripLegIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(tripLegIdValue, 'tripLegId'));
    if (!row) throw this.notFound();
    return toTripLegResponse(row);
  }

  async listByMasterTrip(masterTripIdValue: unknown) {
    const masterTripId = positiveInt(masterTripIdValue, 'masterTripId');
    if (!(await this.repo.masterTripById(masterTripId))) {
      throw new NotFoundException({ error: { code: 'MASTER_TRIP_NOT_FOUND', message: 'Master trip not found' } });
    }
    return { data: (await this.repo.findByMasterTrip(masterTripId)).map((row) => toTripLegResponse(row).data), message: 'Success' };
  }

  async assignBooking(tripLegIdValue: unknown, body: AssignBookingToTripLegRequest) {
    const tripLegId = positiveInt(tripLegIdValue, 'tripLegId');
    const bookingId = positiveInt(body.bookingId, 'bookingId');
    const leg = await this.repo.findById(tripLegId);
    if (!leg) throw this.notFound();
    if (leg.status !== TripLegStatus.PLANNED) {
      throw new BadRequestException({ error: { code: 'TRIP_LEG_LOCKED', message: 'Only planned trip legs can receive booking allocations' } });
    }
    const booking = await this.repo.bookingById(bookingId);
    if (!booking) throw new BadRequestException({ error: { code: 'BOOKING_NOT_FOUND', message: 'Booking does not exist' } });
    if (!([BookingStatus.CONFIRMED, BookingStatus.ASSIGNED] as BookingStatus[]).includes(booking.status as BookingStatus)) {
      throw new BadRequestException({ error: { code: 'BOOKING_NOT_ASSIGNABLE', message: 'Booking must be confirmed or assigned' } });
    }
    if (booking.routeId !== leg.routeId) {
      throw new BadRequestException({ error: { code: 'BOOKING_ROUTE_MISMATCH', message: 'Booking route must match trip leg route' } });
    }
    if (await this.repo.existingLegBooking(tripLegId, bookingId)) {
      throw new BadRequestException({ error: { code: 'BOOKING_ALREADY_ASSIGNED', message: 'Booking is already assigned to this trip leg' } });
    }
    const row = await this.repo.assignBooking(tripLegId, bookingId, optionalDecimal(body.allocatedWeightTons, 'allocatedWeightTons'));
    return toTripLegResponse(row!);
  }

  async dispatch(tripLegIdValue: unknown, body: Record<string, unknown>) {
    const tripLegId = positiveInt(tripLegIdValue, 'tripLegId');
    const leg = await this.repo.findById(tripLegId);
    if (!leg) throw this.notFound();
    if (leg.status !== TripLegStatus.PLANNED) {
      throw new BadRequestException({ error: { code: 'INVALID_TRIP_LEG_STATUS', message: 'Only planned trip legs can be dispatched' } });
    }
    const row = await this.repo.dispatch(tripLegId, optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null);
    return toTripLegResponse(row!);
  }

  async complete(tripLegIdValue: unknown, body: Record<string, unknown>) {
    const tripLegId = positiveInt(tripLegIdValue, 'tripLegId');
    const leg = await this.repo.findById(tripLegId);
    if (!leg) throw this.notFound();
    if (leg.status !== TripLegStatus.DISPATCHED) {
      throw new BadRequestException({ error: { code: 'INVALID_TRIP_LEG_STATUS', message: 'Only dispatched trip legs can be completed' } });
    }
    const row = await this.repo.complete(tripLegId, optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null);
    return toTripLegResponse(row!);
  }

  async emergencyOverride(tripLegIdValue: unknown, body: EmergencyTripOverrideRequest) {
    const tripLegId = positiveInt(tripLegIdValue, 'tripLegId');
    if (!(await this.repo.findById(tripLegId))) throw this.notFound();
    const vehicleId = optionalPositiveInt(body.vehicleId, 'vehicleId') ?? null;
    const driverId = optionalPositiveInt(body.driverId, 'driverId') ?? null;
    if (vehicleId === null && driverId === null) {
      throw new BadRequestException({ error: { code: 'OVERRIDE_TARGET_REQUIRED', message: 'vehicleId or driverId is required' } });
    }
    if (vehicleId !== null) {
      const vehicle = await this.repo.vehicleById(vehicleId);
      if (!vehicle || !vehicle.isActive) throw new BadRequestException({ error: { code: 'VEHICLE_NOT_FOUND', message: 'Active vehicle does not exist' } });
    }
    if (driverId !== null) {
      const driver = await this.repo.driverById(driverId);
      if (!driver || !driver.isActive) throw new BadRequestException({ error: { code: 'DRIVER_NOT_FOUND', message: 'Active driver does not exist' } });
    }
    const row = await this.repo.emergencyOverride(tripLegId, {
      vehicleId,
      driverId,
      reason: requiredString(body.reason, 'reason'),
      approvedByUserId: optionalPositiveInt(body.approvedByUserId, 'approvedByUserId') ?? null,
    });
    return toTripLegResponse(row!);
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'TRIP_LEG_NOT_FOUND', message: 'Trip leg not found' } });
  }
}

