import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'contract.create',
  'contract.update',
  'contract.view',
  'contract.activate',
  'contract.cancel',
  'contract_rate.create',
  'contract_rate.update',
  'contract_rate.view',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table customer_contracts (
      id serial primary key,
      customer_id integer not null references customers(id) on delete restrict,
      contract_number varchar(80) not null unique,
      title varchar(220) not null,
      start_date date not null,
      end_date date not null,
      rate_model varchar(30) not null default 'fixed' check (rate_model in ('fixed', 'fuel_linked')),
      fuel_adjustment_enabled boolean not null default false,
      fuel_base_price numeric(12, 2),
      fuel_adjustment_per_liter numeric(12, 2),
      status varchar(20) not null default 'draft' check (status in ('draft', 'active', 'expired', 'cancelled')),
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint customer_contract_dates_valid check (end_date >= start_date),
      constraint customer_contract_fuel_values_non_negative check (
        (fuel_base_price is null or fuel_base_price >= 0) and
        (fuel_adjustment_per_liter is null or fuel_adjustment_per_liter >= 0)
      )
    )
  `.execute(db);

  await sql`
    create table contract_rates (
      id serial primary key,
      contract_id integer not null references customer_contracts(id) on delete cascade,
      route_id integer not null references routes(id) on delete restrict,
      vehicle_type_id integer not null references vehicle_types(id) on delete restrict,
      base_freight_rate numeric(14, 2) not null check (base_freight_rate >= 0),
      minimum_margin_percent numeric(6, 2) not null default 0 check (minimum_margin_percent >= 0),
      loading_charges numeric(12, 2) not null default 0 check (loading_charges >= 0),
      unloading_charges numeric(12, 2) not null default 0 check (unloading_charges >= 0),
      tax_percent numeric(6, 2) not null default 0 check (tax_percent >= 0),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint contract_rates_contract_route_vehicle_unique unique (contract_id, route_id, vehicle_type_id)
    )
  `.execute(db);

  await sql`create index idx_customer_contracts_customer on customer_contracts(customer_id)`.execute(db);
  await sql`create index idx_customer_contracts_status_dates on customer_contracts(status, start_date, end_date)`.execute(db);
  await sql`create index idx_contract_rates_contract on contract_rates(contract_id)`.execute(db);
  await sql`create index idx_contract_rates_route_vehicle on contract_rates(route_id, vehicle_type_id)`.execute(db);

  await db
    .insertInto('permissions')
    .values(
      newPermissions.map((key) => ({
        key,
        label: key.split('.')[1].replace(/_/g, ' '),
        group_name: key.split('.')[0].replace(/_/g, ' '),
      })),
    )
    .onConflict((oc) => oc.column('key').doNothing())
    .execute();

  const superAdminRole = await db
    .selectFrom('roles')
    .select('id')
    .where('name', '=', 'super_admin')
    .executeTakeFirst();

  if (superAdminRole) {
    const permissions = await db
      .selectFrom('permissions')
      .select('id')
      .where('key', 'in', [...newPermissions])
      .execute();

    if (permissions.length > 0) {
      await db
        .insertInto('role_permissions')
        .values(permissions.map((permission) => ({ role_id: superAdminRole.id, permission_id: permission.id })))
        .onConflict((oc) => oc.constraint('role_permissions_pk').doNothing())
        .execute();
    }
  }
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`drop table if exists contract_rates`.execute(db);
  await sql`drop table if exists customer_contracts`.execute(db);
  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
