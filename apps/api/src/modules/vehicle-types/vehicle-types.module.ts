import { Module } from '@nestjs/common'; import { VehicleTypesController } from './vehicle-types.controller'; import { VehicleTypesRepository } from './vehicle-types.repository'; import { VehicleTypesService } from './vehicle-types.service';
@Module({controllers:[VehicleTypesController],providers:[VehicleTypesService,VehicleTypesRepository]}) export class VehicleTypesModule {}
