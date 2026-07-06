import { Module } from '@nestjs/common';
import { CustomerInvoicesController } from './customer-invoices.controller';
import { CustomerInvoicesRepository } from './customer-invoices.repository';
import { CustomerInvoicesService } from './customer-invoices.service';

@Module({
  controllers: [CustomerInvoicesController],
  providers: [CustomerInvoicesService, CustomerInvoicesRepository],
})
export class CustomerInvoicesModule {}
