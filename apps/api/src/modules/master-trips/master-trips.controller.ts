import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateMasterTripRequest, CreateTripLegRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { MasterTripsService } from './master-trips.service';
import { TripLegsService } from '../trip-legs/trip-legs.service';

@Controller('master-trips')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MasterTripsController {
  constructor(
    private readonly service: MasterTripsService,
    private readonly tripLegsService: TripLegsService,
  ) {}

  @Get()
  @Permissions('trip.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('trip.create')
  create(@Body() body: CreateMasterTripRequest) {
    return this.service.create(body);
  }

  @Get(':masterTripId')
  @Permissions('trip.view')
  get(@Param('masterTripId') masterTripId: string) {
    return this.service.get(masterTripId);
  }

  @Post(':masterTripId/add-leg')
  @Permissions('trip.create')
  addLeg(@Param('masterTripId') masterTripId: string, @Body() body: CreateTripLegRequest) {
    return this.service.addLeg(masterTripId, body);
  }

  @Get(':masterTripId/legs')
  @Permissions('trip.view')
  legs(@Param('masterTripId') masterTripId: string) {
    return this.tripLegsService.listByMasterTrip(masterTripId);
  }

  @Get(':masterTripId/timeline')
  @Permissions('trip.view')
  timeline(@Param('masterTripId') masterTripId: string) {
    return this.service.timeline(masterTripId);
  }
}
