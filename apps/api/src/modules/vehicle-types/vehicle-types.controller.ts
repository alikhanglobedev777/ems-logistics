import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CreateVehicleTypeRequest, UpdateVehicleTypeRequest } from '@ems/api-contract';
import { Permissions } from '../../common/decorators/permissions.decorator'; import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; import { PermissionsGuard } from '../../common/guards/permissions.guard'; import { VehicleTypesService } from './vehicle-types.service';
@Controller('vehicle-types') @UseGuards(JwtAuthGuard,PermissionsGuard)
export class VehicleTypesController { constructor(private readonly service:VehicleTypesService){}
  @Get() @Permissions('vehicle.view') list(@Query() query:Record<string,unknown>){return this.service.list(query);}
  @Get(':vehicleTypeId') @Permissions('vehicle.view') get(@Param('vehicleTypeId') id:string){return this.service.get(id);}
  @Post() @Permissions('vehicle.create') create(@Body() body:CreateVehicleTypeRequest){return this.service.create(body);}
  @Patch(':vehicleTypeId') @Permissions('vehicle.update') update(@Param('vehicleTypeId') id:string,@Body() body:UpdateVehicleTypeRequest){return this.service.update(id,body);}
  @Delete(':vehicleTypeId') @Permissions('vehicle.update') remove(@Param('vehicleTypeId') id:string){return this.service.remove(id);}
}
