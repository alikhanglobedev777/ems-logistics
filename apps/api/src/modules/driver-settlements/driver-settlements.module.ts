import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DriverSettlementsController } from './driver-settlements.controller';
import { DriverSettlementsRepository } from './driver-settlements.repository';
import { DriverSettlementsService } from './driver-settlements.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DriverSettlementsController],
  providers: [DriverSettlementsRepository, DriverSettlementsService],
})
export class DriverSettlementsModule {}
