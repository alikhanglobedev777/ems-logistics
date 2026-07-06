import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CustomerInvoicesService } from './customer-invoices.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerInvoicesController {
  constructor(private readonly service: CustomerInvoicesService) {}

  @Get('customer-invoices')
  @Permissions('customer_invoice.view')
  listInvoices(@Query() query: Record<string, unknown>) {
    return this.service.listInvoices(query);
  }

  @Post('customer-invoices')
  @Permissions('customer_invoice.create')
  createInvoice(@Body() body: Record<string, unknown>) {
    return this.service.createInvoice(body);
  }

  @Get('customer-invoices/:customerInvoiceId')
  @Permissions('customer_invoice.view')
  getInvoice(@Param('customerInvoiceId') customerInvoiceId: string) {
    return this.service.getInvoice(customerInvoiceId);
  }

  @Post('customer-invoices/:customerInvoiceId/payments')
  @Permissions('customer_payment.receive')
  receivePayment(@Param('customerInvoiceId') customerInvoiceId: string, @Body() body: Record<string, unknown>) {
    return this.service.receivePayment(customerInvoiceId, body);
  }

  @Get('customer-payments')
  @Permissions('customer_payment.view')
  listPayments(@Query() query: Record<string, unknown>) {
    return this.service.listPayments(query);
  }

  @Get('customer-payments/:customerPaymentId')
  @Permissions('customer_payment.view')
  getPayment(@Param('customerPaymentId') customerPaymentId: string) {
    return this.service.getPayment(customerPaymentId);
  }
}
