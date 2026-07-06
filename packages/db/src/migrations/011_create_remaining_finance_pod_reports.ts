import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'delivery_proof.create',
  'delivery_proof.view',
  'customer_invoice.create',
  'customer_invoice.view',
  'customer_payment.receive',
  'customer_payment.view',
  'agent_commission.create',
  'agent_commission.approve',
  'agent_commission.pay',
  'agent_commission.view',
  'fuel_vendor_invoice.create',
  'fuel_vendor_invoice.view',
  'fuel_vendor_payment.pay',
  'fuel_vendor_payment.view',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table delivery_proofs (
      id serial primary key,
      proof_number varchar(80) not null unique,
      booking_id integer not null unique references bookings(id) on delete restrict,
      master_trip_id integer references master_trips(id) on delete restrict,
      trip_leg_id integer references trip_legs(id) on delete restrict,
      receiver_name varchar(160) not null,
      receiver_phone varchar(60),
      receiver_cnic varchar(30),
      goods_condition varchar(40) not null default 'good'
        check (goods_condition in ('good', 'damaged', 'partial_damage', 'short_quantity')),
      remarks text,
      proof_image_urls jsonb not null default '[]'::jsonb,
      delivered_at timestamp not null default now(),
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table customer_invoices (
      id serial primary key,
      invoice_number varchar(80) not null unique,
      booking_id integer not null unique references bookings(id) on delete restrict,
      customer_id integer not null references customers(id) on delete restrict,
      invoice_date date not null default current_date,
      due_date date,
      subtotal_amount numeric(14, 2) not null default 0 check (subtotal_amount >= 0),
      tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
      total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
      paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
      balance_amount numeric(14, 2) not null default 0 check (balance_amount >= 0),
      status varchar(30) not null default 'issued'
        check (status in ('draft', 'issued', 'partially_paid', 'paid', 'cancelled')),
      notes text,
      issued_at timestamp,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table customer_payments (
      id serial primary key,
      payment_number varchar(80) not null unique,
      customer_invoice_id integer not null references customer_invoices(id) on delete restrict,
      customer_id integer not null references customers(id) on delete restrict,
      amount numeric(14, 2) not null check (amount > 0),
      payment_date date not null default current_date,
      payment_method varchar(40) not null default 'cash'
        check (payment_method in ('cash', 'bank_transfer', 'cheque', 'mobile_wallet', 'adjustment')),
      reference_number varchar(120),
      notes text,
      received_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table agent_commissions (
      id serial primary key,
      commission_number varchar(80) not null unique,
      booking_id integer not null unique references bookings(id) on delete restrict,
      agent_id integer not null references agents(id) on delete restrict,
      commission_type varchar(30) not null check (commission_type in ('fixed', 'percentage', 'manual')),
      commission_value numeric(14, 2),
      commission_amount numeric(14, 2) not null check (commission_amount >= 0),
      status varchar(30) not null default 'pending'
        check (status in ('pending', 'approved', 'paid', 'cancelled')),
      payable_after varchar(40) not null default 'customer_payment'
        check (payable_after in ('delivery', 'customer_invoice', 'customer_payment')),
      approved_at timestamp,
      approved_by_user_id integer references users(id) on delete set null,
      paid_at timestamp,
      paid_by_user_id integer references users(id) on delete set null,
      cancelled_reason text,
      notes text,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table fuel_vendor_invoices (
      id serial primary key,
      invoice_number varchar(80) not null unique,
      fuel_vendor_id integer not null references fuel_vendors(id) on delete restrict,
      vendor_invoice_number varchar(120),
      invoice_date date not null default current_date,
      due_date date,
      total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
      paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
      balance_amount numeric(14, 2) not null default 0 check (balance_amount >= 0),
      status varchar(30) not null default 'open'
        check (status in ('open', 'partially_paid', 'paid', 'cancelled')),
      notes text,
      created_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table fuel_vendor_invoice_items (
      id serial primary key,
      fuel_vendor_invoice_id integer not null references fuel_vendor_invoices(id) on delete cascade,
      fuel_slip_id integer not null unique references fuel_slips(id) on delete restrict,
      amount numeric(14, 2) not null check (amount >= 0),
      created_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table fuel_vendor_payments (
      id serial primary key,
      payment_number varchar(80) not null unique,
      fuel_vendor_invoice_id integer not null references fuel_vendor_invoices(id) on delete restrict,
      fuel_vendor_id integer not null references fuel_vendors(id) on delete restrict,
      amount numeric(14, 2) not null check (amount > 0),
      payment_date date not null default current_date,
      payment_method varchar(40) not null default 'bank_transfer'
        check (payment_method in ('cash', 'bank_transfer', 'cheque', 'mobile_wallet', 'adjustment')),
      reference_number varchar(120),
      notes text,
      paid_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`create index delivery_proofs_trip_leg_idx on delivery_proofs(trip_leg_id)`.execute(db);
  await sql`create index customer_invoices_customer_idx on customer_invoices(customer_id)`.execute(db);
  await sql`create index customer_invoices_status_idx on customer_invoices(status)`.execute(db);
  await sql`create index customer_payments_invoice_idx on customer_payments(customer_invoice_id)`.execute(db);
  await sql`create index agent_commissions_agent_idx on agent_commissions(agent_id)`.execute(db);
  await sql`create index agent_commissions_status_idx on agent_commissions(status)`.execute(db);
  await sql`create index fuel_vendor_invoices_vendor_idx on fuel_vendor_invoices(fuel_vendor_id)`.execute(db);
  await sql`create index fuel_vendor_invoices_status_idx on fuel_vendor_invoices(status)`.execute(db);
  await sql`create index fuel_vendor_payments_invoice_idx on fuel_vendor_payments(fuel_vendor_invoice_id)`.execute(db);

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
  await sql`drop table if exists fuel_vendor_payments`.execute(db);
  await sql`drop table if exists fuel_vendor_invoice_items`.execute(db);
  await sql`drop table if exists fuel_vendor_invoices`.execute(db);
  await sql`drop table if exists agent_commissions`.execute(db);
  await sql`drop table if exists customer_payments`.execute(db);
  await sql`drop table if exists customer_invoices`.execute(db);
  await sql`drop table if exists delivery_proofs`.execute(db);
  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
