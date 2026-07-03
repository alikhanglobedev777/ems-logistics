import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'agent.create',
  'agent.update',
  'agent.view',
  'route.create',
  'route.update',
  'route.view',
  'fuel_price.manage',
  'fuel_price.view',
  'overhead.manage',
  'overhead.view',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table routes (
      id serial primary key,
      origin_station_id integer not null references stations(id) on delete restrict,
      destination_station_id integer not null references stations(id) on delete restrict,
      name varchar(220) not null,
      distance_km numeric(12, 2),
      estimated_duration_hours numeric(10, 2),
      road_condition varchar(20) not null default 'normal'
        check (road_condition in ('good', 'normal', 'rough', 'high_risk')),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint routes_origin_destination_unique unique (origin_station_id, destination_station_id),
      constraint routes_origin_destination_different check (origin_station_id <> destination_station_id),
      constraint routes_distance_non_negative check (distance_km is null or distance_km >= 0),
      constraint routes_duration_non_negative check (estimated_duration_hours is null or estimated_duration_hours >= 0)
    )
  `.execute(db);

  await sql`
    create table fuel_price_snapshots (
      id serial primary key,
      fuel_type varchar(20) not null check (fuel_type in ('diesel', 'petrol')),
      price_per_liter numeric(12, 2) not null check (price_per_liter >= 0),
      source varchar(20) not null default 'manual' check (source in ('manual', 'api')),
      effective_at timestamp not null,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table route_fuel_profiles (
      id serial primary key,
      route_id integer not null references routes(id) on delete cascade,
      vehicle_type_id integer not null references vehicle_types(id) on delete restrict,
      expected_liters numeric(12, 2) not null check (expected_liters >= 0),
      reserve_liters numeric(12, 2) not null default 0 check (reserve_liters >= 0),
      notes text,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint route_fuel_profiles_route_vehicle_unique unique (route_id, vehicle_type_id)
    )
  `.execute(db);

  await sql`
    create table route_overhead_profiles (
      id serial primary key,
      route_id integer not null references routes(id) on delete cascade,
      vehicle_type_id integer not null references vehicle_types(id) on delete restrict,
      maintenance_cost numeric(12, 2) not null default 0 check (maintenance_cost >= 0),
      tyre_cost numeric(12, 2) not null default 0 check (tyre_cost >= 0),
      oil_service_cost numeric(12, 2) not null default 0 check (oil_service_cost >= 0),
      depreciation_cost numeric(12, 2) not null default 0 check (depreciation_cost >= 0),
      insurance_tax_cost numeric(12, 2) not null default 0 check (insurance_tax_cost >= 0),
      route_risk_cost numeric(12, 2) not null default 0 check (route_risk_cost >= 0),
      empty_return_risk_cost numeric(12, 2) not null default 0 check (empty_return_risk_cost >= 0),
      workshop_reserve_cost numeric(12, 2) not null default 0 check (workshop_reserve_cost >= 0),
      total_overhead numeric(12, 2) not null default 0 check (total_overhead >= 0),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint route_overhead_profiles_route_vehicle_unique unique (route_id, vehicle_type_id)
    )
  `.execute(db);

  await sql`create index idx_routes_origin on routes(origin_station_id)`.execute(db);
  await sql`create index idx_routes_destination on routes(destination_station_id)`.execute(db);
  await sql`create index idx_fuel_price_latest on fuel_price_snapshots(fuel_type, effective_at desc)`.execute(db);
  await sql`create index idx_route_fuel_profiles_route on route_fuel_profiles(route_id)`.execute(db);
  await sql`create index idx_route_overhead_profiles_route on route_overhead_profiles(route_id)`.execute(db);

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
        .values(permissions.map((permission) => ({
          role_id: superAdminRole.id,
          permission_id: permission.id,
        })))
        .onConflict((oc) => oc.constraint('role_permissions_pk').doNothing())
        .execute();
    }
  }
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`drop table if exists route_overhead_profiles`.execute(db);
  await sql`drop table if exists route_fuel_profiles`.execute(db);
  await sql`drop table if exists fuel_price_snapshots`.execute(db);
  await sql`drop table if exists routes`.execute(db);

  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
