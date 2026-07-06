import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FuelVendorsController } from './fuel-vendors.controller';
import { FuelVendorsRepository } from './fuel-vendors.repository';
import { FuelVendorsService } from './fuel-vendors.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FuelVendorsController],
  providers: [FuelVendorsRepository, FuelVendorsService],
})
export class FuelVendorsModule {}
