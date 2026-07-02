import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CreateCityRequest } from '@ems/api-contract';
import { CitiesService } from './cities.service';

@Controller('cities')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @Permissions('station.view')
  getCities() {
    return this.citiesService.getCities();
  }

  @Post()
  @Permissions('station.create')
  createCity(@Body() body: CreateCityRequest) {
    return this.citiesService.createCity(body);
  }
}
