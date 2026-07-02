import type { Kysely } from 'kysely';

const roles = [
  ['super_admin', 'Super Admin'],
  ['admin', 'Admin'],
  ['operations_manager', 'Operations Manager'],
  ['station_manager', 'Station Manager'],
  ['booking_officer', 'Booking Officer'],
  ['dispatcher', 'Dispatcher'],
  ['finance_manager', 'Finance Manager'],
  ['fuel_manager', 'Fuel Manager'],
  ['driver', 'Driver'],
  ['agent', 'Agent'],
  ['customer', 'Customer'],
] as const;

const permissions = [
  'user.manage',
  'role.manage',
  'station.create',
  'station.update',
  'station.view',
  'vehicle.create',
  'vehicle.update',
  'vehicle.view',
  'driver.create',
  'driver.update',
  'driver.view',
  'customer.create',
  'customer.update',
  'customer.view',
  'booking.create',
  'booking.confirm',
  'booking.approve_rate',
  'booking.cancel',
  'booking.view',
  'trip.create',
  'trip.dispatch',
  'trip.complete',
  'trip.view',
  'fuel.verify_slip',
  'fuel.manage_vendor',
  'fuel.view',
  'driver_advance.create',
  'driver.settle',
  'invoice.create',
  'payment.receive',
  'report.view',
  'report.view_profit',
] as const;

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(80)', (col) => col.notNull().unique())
    .addColumn('display_name', 'varchar(120)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('is_system', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createTable('permissions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('key', 'varchar(120)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createTable('role_permissions')
    .addColumn('role_id', 'integer', (col) => col.references('roles.id').onDelete('cascade').notNull())
    .addColumn('permission_id', 'integer', (col) => col.references('permissions.id').onDelete('cascade').notNull())
    .addPrimaryKeyConstraint('role_permissions_pk', ['role_id', 'permission_id'])
    .execute();

  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('role_id', 'integer', (col) => col.references('roles.id').onDelete('restrict').notNull())
    .addColumn('name', 'varchar(150)', (col) => col.notNull())
    .addColumn('email', 'varchar(180)', (col) => col.notNull().unique())
    .addColumn('phone', 'varchar(50)')
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('status', 'varchar(30)', (col) => col.notNull().defaultTo('active'))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createTable('user_refresh_sessions')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.references('users.id').onDelete('cascade').notNull())
    .addColumn('refresh_token_hash', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema.createIndex('idx_users_role_id').on('users').column('role_id').execute();
  await db.schema.createIndex('idx_users_email').on('users').column('email').execute();
  await db.schema
    .createIndex('idx_user_refresh_sessions_user_id')
    .on('user_refresh_sessions')
    .column('user_id')
    .execute();

  await db
    .insertInto('roles')
    .values(roles.map(([name, displayName]) => ({ name, display_name: displayName })))
    .onConflict((oc) => oc.column('name').doNothing())
    .execute();

  await db
    .insertInto('permissions')
    .values(permissions.map((key) => ({ key })))
    .onConflict((oc) => oc.column('key').doNothing())
    .execute();

  const superAdminRole = await db
    .selectFrom('roles')
    .select('id')
    .where('name', '=', 'super_admin')
    .executeTakeFirstOrThrow();

  const allPermissions = await db.selectFrom('permissions').select('id').execute();

  if (allPermissions.length > 0) {
    await db
      .insertInto('role_permissions')
      .values(allPermissions.map((permission) => ({
        role_id: superAdminRole.id,
        permission_id: permission.id,
      })))
      .onConflict((oc) => oc.constraint('role_permissions_pk').doNothing())
      .execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_refresh_sessions').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('role_permissions').ifExists().execute();
  await db.schema.dropTable('permissions').ifExists().execute();
  await db.schema.dropTable('roles').ifExists().execute();
}
