import { config } from 'dotenv';
import path from 'node:path';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import { Pool } from 'pg';
import type { DB } from './types';
import * as createCitiesAndStations from './migrations/001_create_cities_and_stations';
import * as createAuthUsersRoles from './migrations/002_create_auth_users_roles';
import * as alignAuthFoundation from './migrations/003_align_auth_foundation';
import * as createMasterData from './migrations/004_create_master_data';
import * as createRoutesPricingFoundation from './migrations/005_create_routes_pricing_foundation';
import * as createContractsRates from './migrations/006_create_contracts_rates';
import * as createBookingsBilty from './migrations/007_create_bookings_bilty';
import * as createMasterTripsTripLegs from './migrations/008_create_master_trips_trip_legs';
import * as createDriverAdvancesSettlements from './migrations/009_create_driver_advances_settlements';
import * as createFuelVendorsSlips from './migrations/010_create_fuel_vendors_slips';
config({
  path: path.resolve(process.cwd(), '../../.env'),
});
class StaticMigrationProvider {
  async getMigrations() {
    return {
      '001_create_cities_and_stations': createCitiesAndStations,
      '002_create_auth_users_roles': createAuthUsersRoles,
      '003_align_auth_foundation': alignAuthFoundation,
      '004_create_master_data': createMasterData,
      '005_create_routes_pricing_foundation': createRoutesPricingFoundation,
      '006_create_contracts_rates': createContractsRates,
      '007_create_bookings_bilty': createBookingsBilty,
      '008_create_master_trips_trip_legs': createMasterTripsTripLegs,
      '009_create_driver_advances_settlements': createDriverAdvancesSettlements,
      '010_create_fuel_vendors_slips': createFuelVendorsSlips,
    };
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new StaticMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executed successfully`);
    }

    if (result.status === 'Error') {
      console.error(`Migration "${result.migrationName}" failed`);
    }
  });

  if (error) {
    console.error('Migration failed');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

main();
