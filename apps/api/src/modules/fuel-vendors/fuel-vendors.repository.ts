import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type FuelVendorFilters = { search?: string; isActive?: boolean };
export type FuelVendorInput = {
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  ntn: string | null;
  paymentTermsDays: number;
  isActive: boolean;
};
export type FuelVendorUpdateInput = Partial<FuelVendorInput>;

@Injectable()
export class FuelVendorsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private baseSelect() {
    return this.db.selectFrom('fuel_vendors').select([
      'id',
      'name',
      'contact_person as contactPerson',
      'phone',
      'email',
      'address',
      'city',
      'ntn',
      'payment_terms_days as paymentTermsDays',
      'is_active as isActive',
      'created_at as createdAt',
      'updated_at as updatedAt',
    ]);
  }

  findAll(filters: FuelVendorFilters, offset: number, limit: number) {
    return this.baseSelect()
      .$if(Boolean(filters.search), (qb) => qb.where('name', 'ilike', `%${filters.search}%`))
      .$if(filters.isActive !== undefined, (qb) => qb.where('is_active', '=', filters.isActive!))
      .orderBy('name', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async count(filters: FuelVendorFilters) {
    const row = await this.db.selectFrom('fuel_vendors')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where('name', 'ilike', `%${filters.search}%`))
      .$if(filters.isActive !== undefined, (qb) => qb.where('is_active', '=', filters.isActive!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findById(id: number) {
    return this.baseSelect().where('id', '=', id).executeTakeFirst();
  }

  findByName(name: string) {
    return this.db.selectFrom('fuel_vendors').select('id').where('name', '=', name).executeTakeFirst();
  }

  async create(input: FuelVendorInput) {
    const insert: Insertable<EMSDB['fuel_vendors']> = {
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city,
      ntn: input.ntn,
      payment_terms_days: input.paymentTermsDays,
      is_active: input.isActive,
    };
    const row = await this.db.insertInto('fuel_vendors').values(insert).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async update(id: number, input: FuelVendorUpdateInput) {
    const patch: Updateable<EMSDB['fuel_vendors']> = { updated_at: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.contactPerson !== undefined) patch.contact_person = input.contactPerson;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.address !== undefined) patch.address = input.address;
    if (input.city !== undefined) patch.city = input.city;
    if (input.ntn !== undefined) patch.ntn = input.ntn;
    if (input.paymentTermsDays !== undefined) patch.payment_terms_days = input.paymentTermsDays;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    await this.db.updateTable('fuel_vendors').set(patch).where('id', '=', id).executeTakeFirst();
    return this.findById(id);
  }
}
