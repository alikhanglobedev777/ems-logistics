import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateRouteRequest, UpdateRouteRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RoutesService } from './routes.service';

@Controller('routes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoutesController {
  constructor(private readonly service: RoutesService) {}

  @Get()
  @Permissions('route.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get(':routeId')
  @Permissions('route.view')
  get(@Param('routeId') routeId: string) {
    return this.service.get(routeId);
  }

  @Post()
  @Permissions('route.create')
  create(@Body() body: CreateRouteRequest) {
    return this.service.create(body);
  }

  @Patch(':routeId')
  @Permissions('route.update')
  update(@Param('routeId') routeId: string, @Body() body: UpdateRouteRequest) {
    return this.service.update(routeId, body);
  }

  @Delete(':routeId')
  @Permissions('route.update')
  remove(@Param('routeId') routeId: string) {
    return this.service.remove(routeId);
  }
}
