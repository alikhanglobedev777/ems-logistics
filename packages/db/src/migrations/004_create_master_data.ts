import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table vehicle_types (
      id serial primary key,
      name varchar(120) not null,
      code varchar(40) not null unique,
      capacity_tons numeric(10, 2),
      description text,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table vehicles (
      id serial primary key,
      vehicle_number varchar(60) not null unique,
      vehicle_type_id integer not null references vehicle_types(id) on delete restrict,
      current_station_id integer not null references stations(id) on delete restrict,
      status varchar(30) not null default 'available'
        check (status in ('available', 'assigned', 'in_transit', 'maintenance', 'breakdown', 'inactive')),
      fuel_card_number varchar(100),
      registration_expiry date,
      fitness_expiry date,
      insurance_expiry date,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table drivers (
      id serial primary key,
      name varchar(150) not null,
      phone varchar(50) not null unique,
      cnic varchar(30) unique,
      license_number varchar(80),
      license_expiry date,
      address text,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table driver_vehicle_assignments (
      id serial primary key,
      driver_id integer not null references drivers(id) on delete restrict,
      vehicle_id integer not null references vehicles(id) on delete restrict,
      assignment_type varchar(20) not null check (assignment_type in ('primary', 'temporary')),
      start_date date not null,
      end_date date,
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      check (end_date is null or end_date >= start_date)
    )
  `.execute(db);

  await sql`
    create unique index uq_active_primary_driver_per_vehicle
    on driver_vehicle_assignments (vehicle_id)
    where assignment_type = 'primary' and is_active = true and end_date is null
  `.execute(db);

  await sql`
    create table customers (
      id serial primary key,
      name varchar(180) not null,
      contact_person varchar(150) not null,
      phone varchar(50) not null,
      email varchar(180),
      billing_address text,
      customer_type varchar(20) not null check (customer_type in ('contracted', 'spot')),
      ntn varchar(50),
      strn varchar(50),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table agents (
      id serial primary key,
      name varchar(150) not null,
      phone varchar(50) not null,
      email varchar(180),
      station_id integer references stations(id) on delete restrict,
      commission_type varchar(20) not null check (commission_type in ('fixed', 'percentage', 'manual')),
      commission_value numeric(12, 2),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      check (commission_value is null or commission_value >= 0),
      check (commission_type <> 'percentage' or commission_value is null or commission_value <= 100)
    )
  `.execute(db);

  await sql`create index idx_vehicles_vehicle_type on vehicles(vehicle_type_id)`.execute(db);
  await sql`create index idx_vehicles_station on vehicles(current_station_id)`.execute(db);
  await sql`create index idx_assignments_driver on driver_vehicle_assignments(driver_id)`.execute(db);
  await sql`create index idx_assignments_vehicle on driver_vehicle_assignments(vehicle_id)`.execute(db);
  await sql`create index idx_agents_station on agents(station_id)`.execute(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`drop table if exists agents`.execute(db);
  await sql`drop table if exists customers`.execute(db);
  await sql`drop table if exists driver_vehicle_assignments`.execute(db);
  await sql`drop table if exists drivers`.execute(db);
  await sql`drop table if exists vehicles`.execute(db);
  await sql`drop table if exists vehicle_types`.execute(db);
}
