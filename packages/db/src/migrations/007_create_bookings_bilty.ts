import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'booking.create',
  'booking.confirm',
  'booking.approve_rate',
  'booking.cancel',
  'booking.view',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table bookings (
      id serial primary key,
      booking_number varchar(80) not null unique,
      customer_id integer not null references customers(id) on delete restrict,
      contract_id integer references customer_contracts(id) on delete set null,
      agent_id integer references agents(id) on delete set null,
      origin_station_id integer not null references stations(id) on delete restrict,
      destination_station_id integer not null references stations(id) on delete restrict,
      route_id integer references routes(id) on delete set null,
      required_vehicle_type_id integer not null references vehicle_types(id) on delete restrict,
      status varchar(30) not null default 'draft'
        check (status in ('draft', 'confirmed', 'assigned', 'in_transit', 'delivered', 'pod_uploaded', 'invoiced', 'paid', 'cancelled')),
      cargo_description text not null,
      cargo_weight_tons numeric(12, 2),
      quantity numeric(12, 2),
      pickup_date date,
      delivery_due_date date,
      final_freight_rate numeric(14, 2) not null default 0 check (final_freight_rate >= 0),
      tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
      total_customer_amount numeric(14, 2) not null default 0 check (total_customer_amount >= 0),
      requires_rate_approval boolean not null default false,
      approved_by_user_id integer references users(id) on delete set null,
      approved_at timestamp,
      cancel_reason text,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint bookings_origin_destination_different check (origin_station_id <> destination_station_id),
      constraint bookings_cargo_weight_non_negative check (cargo_weight_tons is null or cargo_weight_tons >= 0),
      constraint bookings_quantity_non_negative check (quantity is null or quantity >= 0)
    )
  `.execute(db);

  await sql`
    create table booking_items (
      id serial primary key,
      booking_id integer not null references bookings(id) on delete cascade,
      description text not null,
      quantity numeric(12, 2) not null default 1 check (quantity >= 0),
      weight_tons numeric(12, 2) check (weight_tons is null or weight_tons >= 0),
      unit varchar(40),
      created_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table booking_pricing_snapshots (
      id serial primary key,
      booking_id integer not null unique references bookings(id) on delete cascade,
      fuel_price_snapshot_id integer references fuel_price_snapshots(id) on delete set null,
      fuel_price_per_liter numeric(12, 2) not null default 0 check (fuel_price_per_liter >= 0),
      expected_liters numeric(12, 2) not null default 0 check (expected_liters >= 0),
      reserve_liters numeric(12, 2) not null default 0 check (reserve_liters >= 0),
      estimated_fuel_cost numeric(14, 2) not null default 0 check (estimated_fuel_cost >= 0),
      internal_overhead_cost numeric(14, 2) not null default 0 check (internal_overhead_cost >= 0),
      agent_commission_estimate numeric(14, 2) not null default 0 check (agent_commission_estimate >= 0),
      suggested_freight_rate numeric(14, 2) not null default 0 check (suggested_freight_rate >= 0),
      final_freight_rate numeric(14, 2) not null default 0 check (final_freight_rate >= 0),
      estimated_margin_amount numeric(14, 2) not null default 0,
      estimated_margin_percent numeric(8, 2) not null default 0,
      pricing_source varchar(20) not null default 'spot' check (pricing_source in ('contract', 'spot', 'manual')),
      created_at timestamp not null default now()
    )
  `.execute(db);

  await sql`create index idx_bookings_customer on bookings(customer_id)`.execute(db);
  await sql`create index idx_bookings_status on bookings(status)`.execute(db);
  await sql`create index idx_bookings_route_vehicle on bookings(route_id, required_vehicle_type_id)`.execute(db);
  await sql`create index idx_booking_items_booking on booking_items(booking_id)`.execute(db);

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
  await sql`drop table if exists booking_pricing_snapshots`.execute(db);
  await sql`drop table if exists booking_items`.execute(db);
  await sql`drop table if exists bookings`.execute(db);
  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
