import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CitiesModule } from './modules/cities/cities.module';
import { StationsModule } from './modules/stations/stations.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { AgentsModule } from './modules/agents/agents.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { DriverVehicleAssignmentsModule } from './modules/driver-vehicle-assignments/driver-vehicle-assignments.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { VehicleTypesModule } from './modules/vehicle-types/vehicle-types.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { RouteOverheadProfilesModule } from './modules/route-overhead-profiles/route-overhead-profiles.module';
import { RouteFuelProfilesModule } from './modules/route-fuel-profiles/route-fuel-profiles.module';
import { FuelPriceSnapshotsModule } from './modules/fuel-price-snapshots/fuel-price-snapshots.module';
import { RoutesModule } from './modules/routes/routes.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ContractRatesModule } from './modules/contract-rates/contract-rates.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { MasterTripsModule } from './modules/master-trips/master-trips.module';
import { TripLegsModule } from './modules/trip-legs/trip-legs.module';
import { DriverAdvancesModule } from './modules/driver-advances/driver-advances.module';
import { DriverSettlementsModule } from './modules/driver-settlements/driver-settlements.module';
import { FuelVendorsModule } from './modules/fuel-vendors/fuel-vendors.module';
import { FuelSlipsModule } from './modules/fuel-slips/fuel-slips.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CitiesModule,
    StationsModule,
    VehicleTypesModule,
    VehiclesModule,
    DriversModule,
    DriverVehicleAssignmentsModule,
    CustomersModule,
    AgentsModule,
    PricingModule,
    RouteOverheadProfilesModule,
    RouteFuelProfilesModule,
    FuelPriceSnapshotsModule,
    RoutesModule,
    ContractsModule,
    ContractRatesModule,
    BookingsModule,
    TripLegsModule,
    MasterTripsModule,
    DriverAdvancesModule,
    DriverSettlementsModule,
    FuelVendorsModule,
    FuelSlipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
