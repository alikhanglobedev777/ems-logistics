import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { FuelVendorInvoicesService } from './fuel-vendor-invoices.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FuelVendorInvoicesController {
  constructor(private readonly service: FuelVendorInvoicesService) {}

  @Get('fuel-vendor-invoices')
  @Permissions('fuel_vendor_invoice.view')
  listInvoices(@Query() query: Record<string, unknown>) {
    return this.service.listInvoices(query);
  }

  @Post('fuel-vendor-invoices')
  @Permissions('fuel_vendor_invoice.create')
  createInvoice(@Body() body: Record<string, unknown>) {
    return this.service.createInvoice(body);
  }

  @Get('fuel-vendor-invoices/:fuelVendorInvoiceId')
  @Permissions('fuel_vendor_invoice.view')
  getInvoice(@Param('fuelVendorInvoiceId') fuelVendorInvoiceId: string) {
    return this.service.getInvoice(fuelVendorInvoiceId);
  }

  @Post('fuel-vendor-invoices/:fuelVendorInvoiceId/payments')
  @Permissions('fuel_vendor_payment.pay')
  payInvoice(@Param('fuelVendorInvoiceId') fuelVendorInvoiceId: string, @Body() body: Record<string, unknown>) {
    return this.service.payInvoice(fuelVendorInvoiceId, body);
  }

  @Get('fuel-vendor-payments')
  @Permissions('fuel_vendor_payment.view')
  listPayments(@Query() query: Record<string, unknown>) {
    return this.service.listPayments(query);
  }

  @Get('fuel-vendor-payments/:fuelVendorPaymentId')
  @Permissions('fuel_vendor_payment.view')
  getPayment(@Param('fuelVendorPaymentId') fuelVendorPaymentId: string) {
    return this.service.getPayment(fuelVendorPaymentId);
  }
}
