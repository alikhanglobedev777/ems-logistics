import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateRouteFuelProfileRequest, UpdateRouteFuelProfileRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RouteFuelProfilesService } from './route-fuel-profiles.service';

@Controller('route-fuel-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RouteFuelProfilesController {
  constructor(private readonly service: RouteFuelProfilesService) {}

  @Get()
  @Permissions('route.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get(':routeFuelProfileId')
  @Permissions('route.view')
  get(@Param('routeFuelProfileId') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Permissions('route.update')
  create(@Body() body: CreateRouteFuelProfileRequest) {
    return this.service.create(body);
  }

  @Patch(':routeFuelProfileId')
  @Permissions('route.update')
  update(@Param('routeFuelProfileId') id: string, @Body() body: UpdateRouteFuelProfileRequest) {
    return this.service.update(id, body);
  }

  @Delete(':routeFuelProfileId')
  @Permissions('route.update')
  remove(@Param('routeFuelProfileId') id: string) {
    return this.service.remove(id);
  }
}
