import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateCustomerContractRequest, UpdateCustomerContractRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  @Permissions('contract.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get(':contractId')
  @Permissions('contract.view')
  get(@Param('contractId') contractId: string) {
    return this.service.get(contractId);
  }

  @Post()
  @Permissions('contract.create')
  create(@Body() body: CreateCustomerContractRequest) {
    return this.service.create(body);
  }

  @Patch(':contractId')
  @Permissions('contract.update')
  update(@Param('contractId') contractId: string, @Body() body: UpdateCustomerContractRequest) {
    return this.service.update(contractId, body);
  }

  @Post(':contractId/activate')
  @Permissions('contract.activate')
  activate(@Param('contractId') contractId: string) {
    return this.service.activate(contractId);
  }

  @Post(':contractId/cancel')
  @Permissions('contract.cancel')
  cancel(@Param('contractId') contractId: string) {
    return this.service.cancel(contractId);
  }

  @Post(':contractId/expire')
  @Permissions('contract.update')
  expire(@Param('contractId') contractId: string) {
    return this.service.expire(contractId);
  }
}
