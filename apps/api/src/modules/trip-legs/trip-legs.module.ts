import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TripLegsController } from './trip-legs.controller';
import { TripLegsRepository } from './trip-legs.repository';
import { TripLegsService } from './trip-legs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TripLegsController],
  providers: [TripLegsRepository, TripLegsService],
  exports: [TripLegsService],
})
export class TripLegsModule {}
