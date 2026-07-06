import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateFuelVendorRequest, UpdateFuelVendorRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FuelVendorsService } from './fuel-vendors.service';

@Controller('fuel-vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FuelVendorsController {
  constructor(private readonly service: FuelVendorsService) {}

  @Get()
  @Permissions('fuel.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('fuel.manage_vendor')
  create(@Body() body: CreateFuelVendorRequest) {
    return this.service.create(body);
  }

  @Get(':fuelVendorId')
  @Permissions('fuel.view')
  get(@Param('fuelVendorId') fuelVendorId: string) {
    return this.service.get(fuelVendorId);
  }

  @Patch(':fuelVendorId')
  @Permissions('fuel.manage_vendor')
  update(@Param('fuelVendorId') fuelVendorId: string, @Body() body: UpdateFuelVendorRequest) {
    return this.service.update(fuelVendorId, body);
  }
}
