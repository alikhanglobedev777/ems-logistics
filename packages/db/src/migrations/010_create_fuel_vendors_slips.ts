import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table fuel_vendors (
      id serial primary key,
      name varchar(180) not null unique,
      contact_person varchar(140),
      phone varchar(40),
      email varchar(180),
      address text,
      city varchar(120),
      ntn varchar(80),
      payment_terms_days integer not null default 0 check (payment_terms_days >= 0),
      is_active boolean not null default true,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table fuel_slips (
      id serial primary key,
      slip_number varchar(80) not null unique,
      fuel_vendor_id integer not null references fuel_vendors(id) on delete restrict,
      master_trip_id integer references master_trips(id) on delete restrict,
      trip_leg_id integer references trip_legs(id) on delete restrict,
      vehicle_id integer not null references vehicles(id) on delete restrict,
      driver_id integer not null references drivers(id) on delete restrict,
      fuel_type varchar(20) not null check (fuel_type in ('diesel', 'petrol')),
      liters numeric(14, 2) not null check (liters > 0),
      price_per_liter numeric(14, 2) not null check (price_per_liter >= 0),
      total_amount numeric(14, 2) not null check (total_amount >= 0),
      slip_date date not null default current_date,
      odometer_reading numeric(14, 2) check (odometer_reading is null or odometer_reading >= 0),
      station_name varchar(180),
      status varchar(30) not null default 'pending'
        check (status in ('pending', 'verified', 'rejected', 'invoiced', 'paid')),
      verified_by_user_id integer references users(id) on delete set null,
      verified_at timestamp,
      rejected_reason text,
      notes text,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint fuel_slips_trip_context_check check (master_trip_id is not null or trip_leg_id is not null)
    )
  `.execute(db);

  await sql`create index fuel_vendors_active_idx on fuel_vendors(is_active)`.execute(db);
  await sql`create index fuel_slips_vendor_idx on fuel_slips(fuel_vendor_id)`.execute(db);
  await sql`create index fuel_slips_master_trip_idx on fuel_slips(master_trip_id)`.execute(db);
  await sql`create index fuel_slips_trip_leg_idx on fuel_slips(trip_leg_id)`.execute(db);
  await sql`create index fuel_slips_vehicle_idx on fuel_slips(vehicle_id)`.execute(db);
  await sql`create index fuel_slips_status_idx on fuel_slips(status)`.execute(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`drop table if exists fuel_slips`.execute(db);
  await sql`drop table if exists fuel_vendors`.execute(db);
}
