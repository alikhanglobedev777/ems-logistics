import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateDriverAdvanceRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DriverAdvancesService } from './driver-advances.service';

@Controller('driver-advances')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DriverAdvancesController {
  constructor(private readonly service: DriverAdvancesService) {}

  @Get()
  @Permissions('driver_advance.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('driver_advance.create')
  create(@Body() body: CreateDriverAdvanceRequest) {
    return this.service.create(body);
  }

  @Get(':advanceId')
  @Permissions('driver_advance.view')
  get(@Param('advanceId') advanceId: string) {
    return this.service.get(advanceId);
  }

  @Post(':advanceId/issue')
  @Permissions('driver_advance.issue')
  issue(@Param('advanceId') advanceId: string, @Body() body: Record<string, unknown>) {
    return this.service.issue(advanceId, body);
  }

  @Post(':advanceId/cancel')
  @Permissions('driver_advance.cancel')
  cancel(@Param('advanceId') advanceId: string, @Body() body: Record<string, unknown>) {
    return this.service.cancel(advanceId, body);
  }
}
