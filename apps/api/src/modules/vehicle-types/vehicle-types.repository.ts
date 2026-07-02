import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

@Injectable()
export class VehicleTypesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}
  private base() { return this.db.selectFrom('vehicle_types').select(['id','name','code','capacity_tons as capacityTons','description','is_active as isActive','created_at as createdAt','updated_at as updatedAt']); }
  findById(id: number) { return this.base().where('id','=',id).executeTakeFirst(); }
  findByCode(code: string) { return this.db.selectFrom('vehicle_types').select('id').where('code','=',code).executeTakeFirst(); }
  findAll(filters: { search?: string; isActive?: boolean }, offset: number, limit: number) {
    let q = this.base();
    if (filters.search) q = q.where((eb) => eb.or([eb('name','ilike',`%${filters.search}%`),eb('code','ilike',`%${filters.search}%`)]));
    if (filters.isActive !== undefined) q = q.where('is_active','=',filters.isActive);
    return q.orderBy('name').offset(offset).limit(limit).execute();
  }
  async count(filters: { search?: string; isActive?: boolean }) {
    let q = this.db.selectFrom('vehicle_types').select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.search) q = q.where((eb) => eb.or([eb('name','ilike',`%${filters.search}%`),eb('code','ilike',`%${filters.search}%`)]));
    if (filters.isActive !== undefined) q = q.where('is_active','=',filters.isActive);
    return (await q.executeTakeFirstOrThrow()).total;
  }
  async create(input: { name:string; code:string; capacityTons:string|null; description:string|null; isActive:boolean }) {
    const row = await this.db.insertInto('vehicle_types').values({name:input.name,code:input.code,capacity_tons:input.capacityTons,description:input.description,is_active:input.isActive}).returning('id').executeTakeFirstOrThrow();
    return this.findById(row.id);
  }
  async update(id:number, input: { name?:string; code?:string; capacityTons?:string|null; description?:string|null; isActive?:boolean }) {
    const patch: Updateable<EMSDB['vehicle_types']> = { updated_at: new Date() };
    if(input.name!==undefined) patch.name=input.name; if(input.code!==undefined) patch.code=input.code;
    if(input.capacityTons!==undefined) patch.capacity_tons=input.capacityTons; if(input.description!==undefined) patch.description=input.description;
    if(input.isActive!==undefined) patch.is_active=input.isActive;
    await this.db.updateTable('vehicle_types').set(patch).where('id','=',id).executeTakeFirst(); return this.findById(id);
  }
}
