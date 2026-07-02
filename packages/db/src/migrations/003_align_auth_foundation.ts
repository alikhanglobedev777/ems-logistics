import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`alter table roles rename column display_name to label`.execute(db);
  await sql`alter table roles add column updated_at timestamp not null default now()`.execute(db);

  await sql`alter table permissions add column label varchar(160)`.execute(db);
  await sql`alter table permissions add column group_name varchar(80)`.execute(db);
  await sql`
    update permissions
    set
      label = initcap(replace(split_part(key, '.', 2), '_', ' ')),
      group_name = initcap(replace(split_part(key, '.', 1), '_', ' '))
  `.execute(db);
  await sql`alter table permissions alter column label set not null`.execute(db);
  await sql`alter table permissions alter column group_name set not null`.execute(db);

  await sql`alter table users add column is_active boolean`.execute(db);
  await sql`update users set is_active = status = 'active'`.execute(db);
  await sql`alter table users alter column is_active set default true`.execute(db);
  await sql`alter table users alter column is_active set not null`.execute(db);
  await sql`alter table users drop column status`.execute(db);
  await sql`alter table users add column updated_at timestamp not null default now()`.execute(db);

  await sql`
    create unique index idx_user_refresh_sessions_token_hash
    on user_refresh_sessions (refresh_token_hash)
  `.execute(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`drop index if exists idx_user_refresh_sessions_token_hash`.execute(db);

  await sql`alter table users add column status varchar(30) not null default 'active'`.execute(db);
  await sql`update users set status = case when is_active then 'active' else 'inactive' end`.execute(db);
  await sql`alter table users drop column is_active`.execute(db);
  await sql`alter table users drop column updated_at`.execute(db);

  await sql`alter table permissions drop column group_name`.execute(db);
  await sql`alter table permissions drop column label`.execute(db);

  await sql`alter table roles drop column updated_at`.execute(db);
  await sql`alter table roles rename column label to display_name`.execute(db);
}
