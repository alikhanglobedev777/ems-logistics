import { config } from 'dotenv';
import path from 'node:path';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import { Pool } from 'pg';
import type { DB } from './types';
import * as createCitiesAndStations from './migrations/001_create_cities_and_stations';
config({
  path: path.resolve(process.cwd(), '../../.env'),
});
class StaticMigrationProvider {
  async getMigrations() {
    return {
      '001_create_cities_and_stations': createCitiesAndStations,
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