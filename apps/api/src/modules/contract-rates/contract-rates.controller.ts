import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateContractRateRequest, UpdateContractRateRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ContractRatesService } from './contract-rates.service';

@Controller('contract-rates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractRatesController {
  constructor(private readonly service: ContractRatesService) {}

  @Get()
  @Permissions('contract_rate.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Get('active-rate')
  @Permissions('contract_rate.view')
  activeRate(@Query() query: Record<string, unknown>) {
    return this.service.activeRate(query);
  }

  @Get(':contractRateId')
  @Permissions('contract_rate.view')
  get(@Param('contractRateId') contractRateId: string) {
    return this.service.get(contractRateId);
  }

  @Post()
  @Permissions('contract_rate.create')
  create(@Body() body: CreateContractRateRequest) {
    return this.service.create(body);
  }

  @Patch(':contractRateId')
  @Permissions('contract_rate.update')
  update(@Param('contractRateId') contractRateId: string, @Body() body: UpdateContractRateRequest) {
    return this.service.update(contractRateId, body);
  }

  @Delete(':contractRateId')
  @Permissions('contract_rate.update')
  remove(@Param('contractRateId') contractRateId: string) {
    return this.service.remove(contractRateId);
  }
}
