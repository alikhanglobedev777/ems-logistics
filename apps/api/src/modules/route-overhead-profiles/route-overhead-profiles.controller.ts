import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateRouteOverheadProfileRequest, UpdateRouteOverheadProfileRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RouteOverheadProfilesService } from './route-overhead-profiles.service';

@Controller('route-overhead-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RouteOverheadProfilesController {
  constructor(private readonly service: RouteOverheadProfilesService) {}

  @Get()
  @Permissions('overhead.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get(':routeOverheadProfileId')
  @Permissions('overhead.view')
  get(@Param('routeOverheadProfileId') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Permissions('overhead.manage')
  create(@Body() body: CreateRouteOverheadProfileRequest) {
    return this.service.create(body);
  }

  @Patch(':routeOverheadProfileId')
  @Permissions('overhead.manage')
  update(@Param('routeOverheadProfileId') id: string, @Body() body: UpdateRouteOverheadProfileRequest) {
    return this.service.update(id, body);
  }

  @Delete(':routeOverheadProfileId')
  @Permissions('overhead.manage')
  remove(@Param('routeOverheadProfileId') id: string) {
    return this.service.remove(id);
  }
}
