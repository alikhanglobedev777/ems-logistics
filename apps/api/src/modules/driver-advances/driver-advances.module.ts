import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DriverAdvancesController } from './driver-advances.controller';
import { DriverAdvancesRepository } from './driver-advances.repository';
import { DriverAdvancesService } from './driver-advances.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DriverAdvancesController],
  providers: [DriverAdvancesRepository, DriverAdvancesService],
})
export class DriverAdvancesModule {}
