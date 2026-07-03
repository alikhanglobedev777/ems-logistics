import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateCustomerContractInput = {
  customerId: number;
  contractNumber: string;
  title: string;
  startDate: string;
  endDate: string;
  rateModel: string;
  fuelAdjustmentEnabled: boolean;
  fuelBasePrice: string | null;
  fuelAdjustmentPerLiter: string | null;
  status: string;
};

export type UpdateCustomerContractInput = Partial<CreateCustomerContractInput>;

@Injectable()
export class ContractsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('customer_contracts')
      .innerJoin('customers', 'customers.id', 'customer_contracts.customer_id')
      .select([
        'customer_contracts.id as id',
        'customer_contracts.customer_id as customerId',
        'customers.name as customerName',
        'customer_contracts.contract_number as contractNumber',
        'customer_contracts.title as title',
        'customer_contracts.start_date as startDate',
        'customer_contracts.end_date as endDate',
        'customer_contracts.rate_model as rateModel',
        'customer_contracts.fuel_adjustment_enabled as fuelAdjustmentEnabled',
        'customer_contracts.fuel_base_price as fuelBasePrice',
        'customer_contracts.fuel_adjustment_per_liter as fuelAdjustmentPerLiter',
        'customer_contracts.status as status',
        'customer_contracts.created_at as createdAt',
        'customer_contracts.updated_at as updatedAt',
      ]);
  }

  customerExists(customerId: number) {
    return this.db
      .selectFrom('customers')
      .select('id')
      .where('id', '=', customerId)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  findByNumber(contractNumber: string) {
    return this.db
      .selectFrom('customer_contracts')
      .select('id')
      .where('contract_number', '=', contractNumber)
      .executeTakeFirst();
  }

  findById(contractId: number) {
    return this.base().where('customer_contracts.id', '=', contractId).executeTakeFirst();
  }

  findAll(filters: { search?: string; customerId?: number; status?: string }, offset: number, limit: number) {
    let query = this.base();

    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('customer_contracts.contract_number', 'ilike', `%${filters.search}%`),
          eb('customer_contracts.title', 'ilike', `%${filters.search}%`),
          eb('customers.name', 'ilike', `%${filters.search}%`),
        ]),
      );
    }
    if (filters.customerId !== undefined) query = query.where('customer_contracts.customer_id', '=', filters.customerId);
    if (filters.status !== undefined) query = query.where('customer_contracts.status', '=', filters.status);

    return query.orderBy('customer_contracts.created_at desc').offset(offset).limit(limit).execute();
  }

  async count(filters: { search?: string; customerId?: number; status?: string }) {
    let query = this.db
      .selectFrom('customer_contracts')
      .innerJoin('customers', 'customers.id', 'customer_contracts.customer_id')
      .select((eb) => eb.fn.countAll<number>().as('total'));

    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('customer_contracts.contract_number', 'ilike', `%${filters.search}%`),
          eb('customer_contracts.title', 'ilike', `%${filters.search}%`),
          eb('customers.name', 'ilike', `%${filters.search}%`),
        ]),
      );
    }
    if (filters.customerId !== undefined) query = query.where('customer_contracts.customer_id', '=', filters.customerId);
    if (filters.status !== undefined) query = query.where('customer_contracts.status', '=', filters.status);

    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: CreateCustomerContractInput) {
    const row = await this.db
      .insertInto('customer_contracts')
      .values({
        customer_id: input.customerId,
        contract_number: input.contractNumber,
        title: input.title,
        start_date: input.startDate,
        end_date: input.endDate,
        rate_model: input.rateModel,
        fuel_adjustment_enabled: input.fuelAdjustmentEnabled,
        fuel_base_price: input.fuelBasePrice,
        fuel_adjustment_per_liter: input.fuelAdjustmentPerLiter,
        status: input.status,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return this.findById(row.id);
  }

  async update(contractId: number, input: UpdateCustomerContractInput) {
    const patch: Updateable<EMSDB['customer_contracts']> = { updated_at: new Date() };

    if (input.customerId !== undefined) patch.customer_id = input.customerId;
    if (input.contractNumber !== undefined) patch.contract_number = input.contractNumber;
    if (input.title !== undefined) patch.title = input.title;
    if (input.startDate !== undefined) patch.start_date = input.startDate;
    if (input.endDate !== undefined) patch.end_date = input.endDate;
    if (input.rateModel !== undefined) patch.rate_model = input.rateModel;
    if (input.fuelAdjustmentEnabled !== undefined) patch.fuel_adjustment_enabled = input.fuelAdjustmentEnabled;
    if (input.fuelBasePrice !== undefined) patch.fuel_base_price = input.fuelBasePrice;
    if (input.fuelAdjustmentPerLiter !== undefined) patch.fuel_adjustment_per_liter = input.fuelAdjustmentPerLiter;
    if (input.status !== undefined) patch.status = input.status;

    await this.db.updateTable('customer_contracts').set(patch).where('id', '=', contractId).executeTakeFirst();
    return this.findById(contractId);
  }
}
