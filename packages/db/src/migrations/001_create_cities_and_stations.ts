import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('cities')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('province', 'varchar(100)')
    .addColumn('country', 'varchar(100)', (col) => col.notNull().defaultTo('Pakistan'))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createTable('stations')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('city_id', 'integer', (col) =>
      col.references('cities.id').onDelete('restrict').notNull(),
    )
    .addColumn('name', 'varchar(150)', (col) => col.notNull())
    .addColumn('code', 'varchar(50)', (col) => col.unique())
    .addColumn('address', 'text')
    .addColumn('contact_phone', 'varchar(50)')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(db.fn('now')))
    .execute();

  await db.schema
    .createIndex('idx_stations_city_id')
    .on('stations')
    .column('city_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('stations').ifExists().execute();
  await db.schema.dropTable('cities').ifExists().execute();
}