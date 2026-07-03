import { Module } from '@nestjs/common';
import { RouteFuelProfilesController } from './route-fuel-profiles.controller';
import { RouteFuelProfilesRepository } from './route-fuel-profiles.repository';
import { RouteFuelProfilesService } from './route-fuel-profiles.service';

@Module({
  controllers: [RouteFuelProfilesController],
  providers: [RouteFuelProfilesService, RouteFuelProfilesRepository],
  exports: [RouteFuelProfilesService, RouteFuelProfilesRepository],
})
export class RouteFuelProfilesModule {}
