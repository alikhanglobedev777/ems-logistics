import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateFuelPriceSnapshotRequest } from '@ems/api-contract';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthUser } from '../../common/types/auth-user';
import { FuelPriceSnapshotsService } from './fuel-price-snapshots.service';

@Controller('fuel-price-snapshots')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FuelPriceSnapshotsController {
  constructor(private readonly service: FuelPriceSnapshotsService) {}

  @Get()
  @Permissions('fuel_price.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get('latest')
  @Permissions('fuel_price.view')
  latest(@Query() query: Record<string, unknown>) {
    return this.service.latest(query);
  }

  @Get(':fuelPriceSnapshotId')
  @Permissions('fuel_price.view')
  get(@Param('fuelPriceSnapshotId') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Permissions('fuel_price.manage')
  create(@Body() body: CreateFuelPriceSnapshotRequest, @CurrentUser() user?: AuthUser) {
    return this.service.create(body, user?.id);
  }
}
