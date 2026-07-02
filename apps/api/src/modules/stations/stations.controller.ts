import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CreateStationRequest, UpdateStationRequest } from '@ems/api-contract';
import { StationsService } from './stations.service';

@Controller('stations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @Permissions('station.view')
  getStations(
    @Query('cityId') cityId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.stationsService.getStations({ cityId, isActive });
  }

  @Get(':stationId')
  @Permissions('station.view')
  getStationById(@Param('stationId') stationId: string) {
    return this.stationsService.getStationById(stationId);
  }

  @Post()
  @Permissions('station.create')
  createStation(@Body() body: CreateStationRequest) {
    return this.stationsService.createStation(body);
  }

  @Patch(':stationId')
  @Permissions('station.update')
  updateStation(@Param('stationId') stationId: string, @Body() body: UpdateStationRequest) {
    return this.stationsService.updateStation(stationId, body);
  }
}
