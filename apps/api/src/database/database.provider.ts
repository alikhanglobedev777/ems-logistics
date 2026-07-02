import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB as EMSDB } from '@ems/db';
import { DB } from './database.tokens';


export const databaseProvider: Provider = {
  provide: DB,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing');
    }

    return new Kysely<EMSDB>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: databaseUrl,
        }),
      }),
    });
  },
};
