import { sql, type Kysely } from 'kysely';
import type { DB } from '../types';

const newPermissions = [
  'driver_advance.create',
  'driver_advance.issue',
  'driver_advance.cancel',
  'driver_advance.view',
  'driver_settlement.create',
  'driver_settlement.finalize',
  'driver_settlement.mark_paid',
  'driver_settlement.cancel',
  'driver_settlement.view',
  'driver_expense.create',
  'driver_expense.approve',
] as const;

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`
    create table driver_advances (
      id serial primary key,
      advance_number varchar(80) not null unique,
      master_trip_id integer not null references master_trips(id) on delete restrict,
      driver_id integer not null references drivers(id) on delete restrict,
      advance_type varchar(40) not null default 'cash_trip_expense'
        check (advance_type in ('cash_trip_expense', 'toll_tax', 'loading_unloading', 'repair_emergency', 'other')),
      amount numeric(14, 2) not null check (amount > 0),
      payment_method varchar(40) not null default 'cash'
        check (payment_method in ('cash', 'bank_transfer', 'mobile_wallet', 'cheque')),
      reason text,
      issued_at timestamp,
      status varchar(30) not null default 'draft'
        check (status in ('draft', 'issued', 'settled', 'cancelled')),
      cancelled_reason text,
      created_by_user_id integer references users(id) on delete set null,
      issued_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table driver_expenses (
      id serial primary key,
      master_trip_id integer not null references master_trips(id) on delete restrict,
      driver_id integer not null references drivers(id) on delete restrict,
      expense_type varchar(40) not null default 'other'
        check (expense_type in ('toll_tax', 'loading_unloading', 'repair_emergency', 'parking', 'other')),
      amount numeric(14, 2) not null check (amount > 0),
      description text,
      incurred_at date not null default current_date,
      status varchar(30) not null default 'submitted'
        check (status in ('submitted', 'approved', 'rejected')),
      approved_by_user_id integer references users(id) on delete set null,
      approved_at timestamp,
      reject_reason text,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`
    create table driver_settlements (
      id serial primary key,
      settlement_number varchar(80) not null unique,
      master_trip_id integer not null unique references master_trips(id) on delete restrict,
      driver_id integer not null references drivers(id) on delete restrict,
      total_advance_amount numeric(14, 2) not null default 0 check (total_advance_amount >= 0),
      total_approved_expense_amount numeric(14, 2) not null default 0 check (total_approved_expense_amount >= 0),
      payable_to_driver_amount numeric(14, 2) not null default 0 check (payable_to_driver_amount >= 0),
      recoverable_from_driver_amount numeric(14, 2) not null default 0 check (recoverable_from_driver_amount >= 0),
      status varchar(30) not null default 'open'
        check (status in ('open', 'under_review', 'settled', 'cancelled')),
      finalized_at timestamp,
      paid_at timestamp,
      cancelled_reason text,
      created_by_user_id integer references users(id) on delete set null,
      finalized_by_user_id integer references users(id) on delete set null,
      paid_by_user_id integer references users(id) on delete set null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    )
  `.execute(db);

  await sql`create index driver_advances_master_trip_idx on driver_advances(master_trip_id)`.execute(db);
  await sql`create index driver_advances_driver_idx on driver_advances(driver_id)`.execute(db);
  await sql`create index driver_advances_status_idx on driver_advances(status)`.execute(db);
  await sql`create index driver_expenses_master_trip_idx on driver_expenses(master_trip_id)`.execute(db);
  await sql`create index driver_expenses_status_idx on driver_expenses(status)`.execute(db);
  await sql`create index driver_settlements_driver_idx on driver_settlements(driver_id)`.execute(db);
  await sql`create index driver_settlements_status_idx on driver_settlements(status)`.execute(db);

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
  await sql`drop table if exists driver_settlements`.execute(db);
  await sql`drop table if exists driver_expenses`.execute(db);
  await sql`drop table if exists driver_advances`.execute(db);
  await db.deleteFrom('permissions').where('key', 'in', [...newPermissions]).execute();
}
