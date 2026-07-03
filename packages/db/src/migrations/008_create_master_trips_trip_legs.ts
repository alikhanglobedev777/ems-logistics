import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'trip.create',
  'trip.dispatch',
  'trip.complete',
  'trip.view',
  'trip.override_assignment',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table master_trips (
      id serial primary key,
      trip_number varchar(80) not null unique,
      vehicle_id integer not null references vehicles(id) on delete restrict,
      driver_id integer not null references drivers(id) on delete restrict,
      start_station_id integer not null references stations(id) on delete restrict,
      current_station_id integer not null references stations(id) on delete restrict,
      status varchar(30) not null default 'planned'
        check (status in ('planned', 'dispatched', 'in_transit', 'completed', 'cancelled')),
      planned_start_at timestamp,
      actual_start_at timestamp,
      completed_at timestamp,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table trip_legs (
      id serial primary key,
      master_trip_id integer not null references master_trips(id) on delete cascade,
      sequence_no integer not null check (sequence_no > 0),
      route_id integer not null references routes(id) on delete restrict,
      origin_station_id integer not null references stations(id) on delete restrict,
      destination_station_id integer not null references stations(id) on delete restrict,
      planned_departure_at timestamp,
      actual_departure_at timestamp,
      actual_arrival_at timestamp,
      status varchar(30) not null default 'planned'
        check (status in ('planned', 'dispatched', 'arrived', 'completed', 'cancelled')),
      override_vehicle_id integer references vehicles(id) on delete set null,
      override_driver_id integer references drivers(id) on delete set null,
      override_reason text,
      override_approved_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      unique (master_trip_id, sequence_no),
      constraint trip_legs_origin_destination_different check (origin_station_id <> destination_station_id)
    )
  `.execute(db);

  await sql`
    create table trip_leg_bookings (
      id serial primary key,
      trip_leg_id integer not null references trip_legs(id) on delete cascade,
      booking_id integer not null references bookings(id) on delete restrict,
      allocated_weight_tons numeric(12, 2) check (allocated_weight_tons is null or allocated_weight_tons >= 0),
      created_at timestamp not null default now(),
      unique (trip_leg_id, booking_id)
    )
  `.execute(db);

  await sql`
    create table trip_events (
      id serial primary key,
      master_trip_id integer not null references master_trips(id) on delete cascade,
      trip_leg_id integer references trip_legs(id) on delete cascade,
      event_type varchar(80) not null,
      title varchar(160) not null,
      description text,
      station_id integer references stations(id) on delete set null,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now()
    )
  `.execute(db);

  await sql`create index master_trips_status_idx on master_trips(status)`.execute(db);
  await sql`create index master_trips_vehicle_idx on master_trips(vehicle_id)`.execute(db);
  await sql`create index trip_legs_master_trip_idx on trip_legs(master_trip_id)`.execute(db);
  await sql`create index trip_legs_status_idx on trip_legs(status)`.execute(db);
  await sql`create index trip_leg_bookings_booking_idx on trip_leg_bookings(booking_id)`.execute(db);
  await sql`create index trip_events_master_trip_idx on trip_events(master_trip_id)`.execute(db);

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

  const superAdminRole = await db.selectFrom('roles').select('id').where('name', '=', 'super_admin').executeTakeFirst();
  if (superAdminRole) {
    const permissions = await db.selectFrom('permissions').select('id').where('key', 'in', [...newPermissions]).execute();
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
  await sql`drop table if exists trip_events`.execute(db);
  await sql`drop table if exists trip_leg_bookings`.execute(db);
  await sql`drop table if exists trip_legs`.execute(db);
  await sql`drop table if exists master_trips`.execute(db);
  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
