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
