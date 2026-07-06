import { Module } from '@nestjs/common';
import { FuelVendorInvoicesController } from './fuel-vendor-invoices.controller';
import { FuelVendorInvoicesRepository } from './fuel-vendor-invoices.repository';
import { FuelVendorInvoicesService } from './fuel-vendor-invoices.service';

@Module({
  controllers: [FuelVendorInvoicesController],
  providers: [FuelVendorInvoicesService, FuelVendorInvoicesRepository],
})
export class FuelVendorInvoicesModule {}
