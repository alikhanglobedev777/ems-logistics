import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CreateContractRateInput = {
  contractId: number;
  routeId: number;
  vehicleTypeId: number;
  baseFreightRate: string;
  minimumMarginPercent: string;
  loadingCharges: string;
  unloadingCharges: string;
  taxPercent: string;
  isActive: boolean;
};

export type UpdateContractRateInput = Partial<CreateContractRateInput>;

@Injectable()
export class ContractRatesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('contract_rates')
      .innerJoin('customer_contracts', 'customer_contracts.id', 'contract_rates.contract_id')
      .innerJoin('routes', 'routes.id', 'contract_rates.route_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'contract_rates.vehicle_type_id')
      .select([
        'contract_rates.id as id',
        'contract_rates.contract_id as contractId',
        'customer_contracts.contract_number as contractNumber',
        'contract_rates.route_id as routeId',
        'routes.name as routeName',
        'contract_rates.vehicle_type_id as vehicleTypeId',
        'vehicle_types.name as vehicleTypeName',
        'vehicle_types.code as vehicleTypeCode',
        'contract_rates.base_freight_rate as baseFreightRate',
        'contract_rates.minimum_margin_percent as minimumMarginPercent',
        'contract_rates.loading_charges as loadingCharges',
        'contract_rates.unloading_charges as unloadingCharges',
        'contract_rates.tax_percent as taxPercent',
        'contract_rates.is_active as isActive',
        'contract_rates.created_at as createdAt',
        'contract_rates.updated_at as updatedAt',
      ]);
  }

  contractExists(contractId: number) {
    return this.db.selectFrom('customer_contracts').select('id').where('id', '=', contractId).executeTakeFirst();
  }

  routeExists(routeId: number) {
    return this.db.selectFrom('routes').select('id').where('id', '=', routeId).where('is_active', '=', true).executeTakeFirst();
  }

  vehicleTypeExists(vehicleTypeId: number) {
    return this.db
      .selectFrom('vehicle_types')
      .select('id')
      .where('id', '=', vehicleTypeId)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  findDuplicate(contractId: number, routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('contract_rates')
      .select('id')
      .where('contract_id', '=', contractId)
      .where('route_id', '=', routeId)
      .where('vehicle_type_id', '=', vehicleTypeId)
      .executeTakeFirst();
  }

  findById(contractRateId: number) {
    return this.base().where('contract_rates.id', '=', contractRateId).executeTakeFirst();
  }

  findAll(filters: { contractId?: number; routeId?: number; vehicleTypeId?: number; isActive?: boolean }, offset: number, limit: number) {
    let query = this.base();
    if (filters.contractId !== undefined) query = query.where('contract_rates.contract_id', '=', filters.contractId);
    if (filters.routeId !== undefined) query = query.where('contract_rates.route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('contract_rates.vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('contract_rates.is_active', '=', filters.isActive);
    return query.orderBy('contract_rates.created_at desc').offset(offset).limit(limit).execute();
  }

  async count(filters: { contractId?: number; routeId?: number; vehicleTypeId?: number; isActive?: boolean }) {
    let query = this.db.selectFrom('contract_rates').select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.contractId !== undefined) query = query.where('contract_id', '=', filters.contractId);
    if (filters.routeId !== undefined) query = query.where('route_id', '=', filters.routeId);
    if (filters.vehicleTypeId !== undefined) query = query.where('vehicle_type_id', '=', filters.vehicleTypeId);
    if (filters.isActive !== undefined) query = query.where('is_active', '=', filters.isActive);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async findActiveRate(customerId: number, routeId: number, vehicleTypeId: number, effectiveDate: Date) {
    return this.base()
      .innerJoin('customers', 'customers.id', 'customer_contracts.customer_id')
      .where('customer_contracts.customer_id', '=', customerId)
      .where('customer_contracts.status', '=', 'active')
      .where('customer_contracts.start_date', '<=', effectiveDate)
      .where('customer_contracts.end_date', '>=', effectiveDate)
      .where('contract_rates.route_id', '=', routeId)
      .where('contract_rates.vehicle_type_id', '=', vehicleTypeId)
      .where('contract_rates.is_active', '=', true)
      .orderBy('customer_contracts.start_date desc')
      .executeTakeFirst();
  }

  async create(input: CreateContractRateInput) {
    const row = await this.db
      .insertInto('contract_rates')
      .values({
        contract_id: input.contractId,
        route_id: input.routeId,
        vehicle_type_id: input.vehicleTypeId,
        base_freight_rate: input.baseFreightRate,
        minimum_margin_percent: input.minimumMarginPercent,
        loading_charges: input.loadingCharges,
        unloading_charges: input.unloadingCharges,
        tax_percent: input.taxPercent,
        is_active: input.isActive,
      })
      .returning('id')
      .executeTakeFirstOrThrow();
    return this.findById(row.id);
  }

  async update(contractRateId: number, input: UpdateContractRateInput) {
    const patch: Updateable<EMSDB['contract_rates']> = { updated_at: new Date() };
    if (input.contractId !== undefined) patch.contract_id = input.contractId;
    if (input.routeId !== undefined) patch.route_id = input.routeId;
    if (input.vehicleTypeId !== undefined) patch.vehicle_type_id = input.vehicleTypeId;
    if (input.baseFreightRate !== undefined) patch.base_freight_rate = input.baseFreightRate;
    if (input.minimumMarginPercent !== undefined) patch.minimum_margin_percent = input.minimumMarginPercent;
    if (input.loadingCharges !== undefined) patch.loading_charges = input.loadingCharges;
    if (input.unloadingCharges !== undefined) patch.unloading_charges = input.unloadingCharges;
    if (input.taxPercent !== undefined) patch.tax_percent = input.taxPercent;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    await this.db.updateTable('contract_rates').set(patch).where('id', '=', contractRateId).executeTakeFirst();
    return this.findById(contractRateId);
  }
}

