import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DeliveryProofsService } from './delivery-proofs.service';

@Controller('delivery-proofs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeliveryProofsController {
  constructor(private readonly service: DeliveryProofsService) {}

  @Get()
  @Permissions('delivery_proof.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('delivery_proof.create')
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Get(':deliveryProofId')
  @Permissions('delivery_proof.view')
  get(@Param('deliveryProofId') deliveryProofId: string) {
    return this.service.get(deliveryProofId);
  }
}
