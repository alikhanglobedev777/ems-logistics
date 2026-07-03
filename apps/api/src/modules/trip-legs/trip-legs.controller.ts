import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { AssignBookingToTripLegRequest, EmergencyTripOverrideRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TripLegsService } from './trip-legs.service';

@Controller('trip-legs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TripLegsController {
  constructor(private readonly service: TripLegsService) {}

  @Get(':tripLegId')
  @Permissions('trip.view')
  get(@Param('tripLegId') tripLegId: string) {
    return this.service.get(tripLegId);
  }

  @Post(':tripLegId/assign-booking')
  @Permissions('trip.create')
  assignBooking(@Param('tripLegId') tripLegId: string, @Body() body: AssignBookingToTripLegRequest) {
    return this.service.assignBooking(tripLegId, body);
  }

  @Post(':tripLegId/dispatch')
  @Permissions('trip.dispatch')
  dispatch(@Param('tripLegId') tripLegId: string, @Body() body: Record<string, unknown>) {
    return this.service.dispatch(tripLegId, body);
  }

  @Post(':tripLegId/complete')
  @Permissions('trip.complete')
  complete(@Param('tripLegId') tripLegId: string, @Body() body: Record<string, unknown>) {
    return this.service.complete(tripLegId, body);
  }

  @Post(':tripLegId/emergency-override')
  @Permissions('trip.override_assignment')
  emergencyOverride(@Param('tripLegId') tripLegId: string, @Body() body: EmergencyTripOverrideRequest) {
    return this.service.emergencyOverride(tripLegId, body);
  }
}
