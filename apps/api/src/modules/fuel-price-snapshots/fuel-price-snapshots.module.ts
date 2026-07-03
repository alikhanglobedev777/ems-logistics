import { Module } from '@nestjs/common';
import { FuelPriceSnapshotsController } from './fuel-price-snapshots.controller';
import { FuelPriceSnapshotsRepository } from './fuel-price-snapshots.repository';
import { FuelPriceSnapshotsService } from './fuel-price-snapshots.service';

@Module({
  controllers: [FuelPriceSnapshotsController],
  providers: [FuelPriceSnapshotsService, FuelPriceSnapshotsRepository],
  exports: [FuelPriceSnapshotsService, FuelPriceSnapshotsRepository],
})
export class FuelPriceSnapshotsModule {}
