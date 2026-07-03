import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateDriverExpenseRequest, CreateDriverSettlementRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DriverSettlementsService } from './driver-settlements.service';

@Controller('driver-settlements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DriverSettlementsController {
  constructor(private readonly service: DriverSettlementsService) {}

  @Get()
  @Permissions('driver_settlement.view')
  list(@Query() query: Record<string, unknown>) {
    return this.service.list(query);
  }

  @Post()
  @Permissions('driver_settlement.create')
  create(@Body() body: CreateDriverSettlementRequest) {
    return this.service.create(body);
  }

  @Get(':settlementId')
  @Permissions('driver_settlement.view')
  get(@Param('settlementId') settlementId: string) {
    return this.service.get(settlementId);
  }

  @Post(':settlementId/finalize')
  @Permissions('driver_settlement.finalize')
  finalize(@Param('settlementId') settlementId: string, @Body() body: Record<string, unknown>) {
    return this.service.finalize(settlementId, body);
  }

  @Post(':settlementId/mark-paid')
  @Permissions('driver_settlement.mark_paid')
  markPaid(@Param('settlementId') settlementId: string, @Body() body: Record<string, unknown>) {
    return this.service.markPaid(settlementId, body);
  }

  @Post(':settlementId/cancel')
  @Permissions('driver_settlement.cancel')
  cancel(@Param('settlementId') settlementId: string, @Body() body: Record<string, unknown>) {
    return this.service.cancel(settlementId, body);
  }

  @Get('expenses/list')
  @Permissions('driver_settlement.view')
  listExpenses(@Query() query: Record<string, unknown>) {
    return this.service.listExpenses(query);
  }

  @Post('expenses')
  @Permissions('driver_expense.create')
  createExpense(@Body() body: CreateDriverExpenseRequest) {
    return this.service.createExpense(body);
  }

  @Post('expenses/:expenseId/approve')
  @Permissions('driver_expense.approve')
  approveExpense(@Param('expenseId') expenseId: string, @Body() body: Record<string, unknown>) {
    return this.service.approveExpense(expenseId, body);
  }

  @Post('expenses/:expenseId/reject')
  @Permissions('driver_expense.approve')
  rejectExpense(@Param('expenseId') expenseId: string, @Body() body: Record<string, unknown>) {
    return this.service.rejectExpense(expenseId, body);
  }
}
