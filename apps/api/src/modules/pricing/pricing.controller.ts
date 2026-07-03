import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get('route-estimate')
  @Permissions('route.view', 'fuel_price.view', 'overhead.view')
  routeEstimate(@Query() query: Record<string, unknown>) {
    return this.service.routeEstimate(query);
  }
}
