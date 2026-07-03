import { Module } from '@nestjs/common';
import { RouteOverheadProfilesController } from './route-overhead-profiles.controller';
import { RouteOverheadProfilesRepository } from './route-overhead-profiles.repository';
import { RouteOverheadProfilesService } from './route-overhead-profiles.service';

@Module({
  controllers: [RouteOverheadProfilesController],
  providers: [RouteOverheadProfilesService, RouteOverheadProfilesRepository],
  exports: [RouteOverheadProfilesService, RouteOverheadProfilesRepository],
})
export class RouteOverheadProfilesModule {}
