import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AgentCommissionsService } from './agent-commissions.service';

@Controller('agent-commissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgentCommissionsController {
  constructor(private readonly service: AgentCommissionsService) {}

  @Get()
  @Permissions('agent_commission.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('agent_commission.create')
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Get(':agentCommissionId')
  @Permissions('agent_commission.view')
  get(@Param('agentCommissionId') agentCommissionId: string) {
    return this.service.get(agentCommissionId);
  }

  @Post(':agentCommissionId/approve')
  @Permissions('agent_commission.approve')
  approve(@Param('agentCommissionId') agentCommissionId: string, @Body() body: Record<string, unknown>) {
    return this.service.approve(agentCommissionId, body);
  }

  @Post(':agentCommissionId/pay')
  @Permissions('agent_commission.pay')
  markPaid(@Param('agentCommissionId') agentCommissionId: string, @Body() body: Record<string, unknown>) {
    return this.service.markPaid(agentCommissionId, body);
  }

  @Post(':agentCommissionId/cancel')
  @Permissions('agent_commission.approve')
  cancel(@Param('agentCommissionId') agentCommissionId: string, @Body() body: Record<string, unknown>) {
    return this.service.cancel(agentCommissionId, body);
  }
}
