import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TripLegsModule } from '../trip-legs/trip-legs.module';
import { MasterTripsController } from './master-trips.controller';
import { MasterTripsRepository } from './master-trips.repository';
import { MasterTripsService } from './master-trips.service';

@Module({
  imports: [DatabaseModule, TripLegsModule],
  controllers: [MasterTripsController],
  providers: [MasterTripsRepository, MasterTripsService],
})
export class MasterTripsModule {}
