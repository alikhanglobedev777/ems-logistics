import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateFuelSlipRequest, RejectFuelSlipRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FuelSlipsService } from './fuel-slips.service';

@Controller('fuel-slips')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FuelSlipsController {
  constructor(private readonly service: FuelSlipsService) {}

  @Get()
  @Permissions('fuel.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('fuel.verify_slip')
  create(@Body() body: CreateFuelSlipRequest) {
    return this.service.create(body);
  }

  @Get(':fuelSlipId')
  @Permissions('fuel.view')
  get(@Param('fuelSlipId') fuelSlipId: string) {
    return this.service.get(fuelSlipId);
  }

  @Post(':fuelSlipId/verify')
  @Permissions('fuel.verify_slip')
  verify(@Param('fuelSlipId') fuelSlipId: string, @Body() body: Record<string, unknown>) {
    return this.service.verify(fuelSlipId, body);
  }

  @Post(':fuelSlipId/reject')
  @Permissions('fuel.verify_slip')
  reject(@Param('fuelSlipId') fuelSlipId: string, @Body() body: RejectFuelSlipRequest) {
    return this.service.reject(fuelSlipId, body);
  }
}
