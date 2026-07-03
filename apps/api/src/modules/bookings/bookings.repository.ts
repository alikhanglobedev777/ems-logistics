import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type BookingCreateInput = {
  bookingNumber: string;
  customerId: number;
  contractId: number | null;
  agentId: number | null;
  originStationId: number;
  destinationStationId: number;
  routeId: number | null;
  requiredVehicleTypeId: number;
  status: string;
  cargoDescription: string;
  cargoWeightTons: string | null;
  quantity: string | null;
  pickupDate: string | null;
  deliveryDueDate: string | null;
  finalFreightRate: string;
  taxAmount: string;
  totalCustomerAmount: string;
  requiresRateApproval: boolean;
  createdByUserId: number | null;
};

export type BookingUpdateInput = Partial<Pick<BookingCreateInput,
  'customerId' | 'contractId' | 'agentId' | 'originStationId' | 'destinationStationId' | 'routeId' |
  'requiredVehicleTypeId' | 'cargoDescription' | 'cargoWeightTons' | 'quantity' | 'pickupDate' |
  'deliveryDueDate' | 'finalFreightRate' | 'taxAmount' | 'totalCustomerAmount' | 'requiresRateApproval'
>> & {
  status?: string;
  approvedByUserId?: number | null;
  approvedAt?: Date | null;
  cancelReason?: string | null;
};

export type BookingPricingSnapshotInput = {
  fuelPriceSnapshotId: number | null;
  fuelPricePerLiter: string;
  expectedLiters: string;
  reserveLiters: string;
  estimatedFuelCost: string;
  internalOverheadCost: string;
  agentCommissionEstimate: string;
  suggestedFreightRate: string;
  finalFreightRate: string;
  estimatedMarginAmount: string;
  estimatedMarginPercent: string;
  pricingSource: string;
};

@Injectable()
export class BookingsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private base() {
    return this.db
      .selectFrom('bookings')
      .innerJoin('customers', 'customers.id', 'bookings.customer_id')
      .innerJoin('stations as origin_station', 'origin_station.id', 'bookings.origin_station_id')
      .innerJoin('stations as destination_station', 'destination_station.id', 'bookings.destination_station_id')
      .innerJoin('vehicle_types', 'vehicle_types.id', 'bookings.required_vehicle_type_id')
      .leftJoin('customer_contracts', 'customer_contracts.id', 'bookings.contract_id')
      .leftJoin('agents', 'agents.id', 'bookings.agent_id')
      .leftJoin('routes', 'routes.id', 'bookings.route_id')
      .select([
        'bookings.id as id',
        'bookings.booking_number as bookingNumber',
        'bookings.customer_id as customerId',
        'customers.name as customerName',
        'bookings.contract_id as contractId',
        'customer_contracts.contract_number as contractNumber',
        'bookings.agent_id as agentId',
        'agents.name as agentName',
        'bookings.origin_station_id as originStationId',
        'origin_station.name as originStationName',
        'bookings.destination_station_id as destinationStationId',
        'destination_station.name as destinationStationName',
        'bookings.route_id as routeId',
        'routes.name as routeName',
        'bookings.required_vehicle_type_id as requiredVehicleTypeId',
        'vehicle_types.name as requiredVehicleTypeName',
        'vehicle_types.code as requiredVehicleTypeCode',
        'bookings.status as status',
        'bookings.cargo_description as cargoDescription',
        'bookings.cargo_weight_tons as cargoWeightTons',
        'bookings.quantity as quantity',
        'bookings.pickup_date as pickupDate',
        'bookings.delivery_due_date as deliveryDueDate',
        'bookings.final_freight_rate as finalFreightRate',
        'bookings.tax_amount as taxAmount',
        'bookings.total_customer_amount as totalCustomerAmount',
        'bookings.requires_rate_approval as requiresRateApproval',
        'bookings.approved_by_user_id as approvedByUserId',
        'bookings.approved_at as approvedAt',
        'bookings.cancel_reason as cancelReason',
        'bookings.created_at as createdAt',
        'bookings.updated_at as updatedAt',
      ]);
  }

  findById(bookingId: number) {
    return this.base().where('bookings.id', '=', bookingId).executeTakeFirst();
  }

  findByNumber(bookingNumber: string) {
    return this.db.selectFrom('bookings').select('id').where('booking_number', '=', bookingNumber).executeTakeFirst();
  }

  findAll(filters: { search?: string; status?: string; customerId?: number; routeId?: number }, offset: number, limit: number) {
    let query = this.base();
    if (filters.search) {
      query = query.where((eb) => eb.or([
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('bookings.cargo_description', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ]));
    }
    if (filters.status !== undefined) query = query.where('bookings.status', '=', filters.status);
    if (filters.customerId !== undefined) query = query.where('bookings.customer_id', '=', filters.customerId);
    if (filters.routeId !== undefined) query = query.where('bookings.route_id', '=', filters.routeId);
    return query.orderBy('bookings.created_at desc').offset(offset).limit(limit).execute();
  }

  async count(filters: { search?: string; status?: string; customerId?: number; routeId?: number }) {
    let query = this.db
      .selectFrom('bookings')
      .innerJoin('customers', 'customers.id', 'bookings.customer_id')
      .select((eb) => eb.fn.countAll<number>().as('total'));
    if (filters.search) {
      query = query.where((eb) => eb.or([
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('bookings.cargo_description', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ]));
    }
    if (filters.status !== undefined) query = query.where('bookings.status', '=', filters.status);
    if (filters.customerId !== undefined) query = query.where('bookings.customer_id', '=', filters.customerId);
    if (filters.routeId !== undefined) query = query.where('bookings.route_id', '=', filters.routeId);
    return Number((await query.executeTakeFirstOrThrow()).total);
  }

  async create(input: BookingCreateInput, pricing: BookingPricingSnapshotInput, items: Array<{ description: string; quantity: string; weightTons: string | null; unit: string | null }>) {
    const created = await this.db.transaction().execute(async (trx) => {
      const booking = await trx
        .insertInto('bookings')
        .values({
          booking_number: input.bookingNumber,
          customer_id: input.customerId,
          contract_id: input.contractId,
          agent_id: input.agentId,
          origin_station_id: input.originStationId,
          destination_station_id: input.destinationStationId,
          route_id: input.routeId,
          required_vehicle_type_id: input.requiredVehicleTypeId,
          status: input.status,
          cargo_description: input.cargoDescription,
          cargo_weight_tons: input.cargoWeightTons,
          quantity: input.quantity,
          pickup_date: input.pickupDate,
          delivery_due_date: input.deliveryDueDate,
          final_freight_rate: input.finalFreightRate,
          tax_amount: input.taxAmount,
          total_customer_amount: input.totalCustomerAmount,
          requires_rate_approval: input.requiresRateApproval,
          created_by_user_id: input.createdByUserId,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('booking_pricing_snapshots')
        .values({
          booking_id: booking.id,
          fuel_price_snapshot_id: pricing.fuelPriceSnapshotId,
          fuel_price_per_liter: pricing.fuelPricePerLiter,
          expected_liters: pricing.expectedLiters,
          reserve_liters: pricing.reserveLiters,
          estimated_fuel_cost: pricing.estimatedFuelCost,
          internal_overhead_cost: pricing.internalOverheadCost,
          agent_commission_estimate: pricing.agentCommissionEstimate,
          suggested_freight_rate: pricing.suggestedFreightRate,
          final_freight_rate: pricing.finalFreightRate,
          estimated_margin_amount: pricing.estimatedMarginAmount,
          estimated_margin_percent: pricing.estimatedMarginPercent,
          pricing_source: pricing.pricingSource,
        })
        .execute();

      if (items.length > 0) {
        await trx
          .insertInto('booking_items')
          .values(items.map((item) => ({
            booking_id: booking.id,
            description: item.description,
            quantity: item.quantity,
            weight_tons: item.weightTons,
            unit: item.unit,
          })))
          .execute();
      }

      return booking.id;
    });

    return this.findById(created);
  }

  async update(bookingId: number, input: BookingUpdateInput) {
    const patch: Updateable<EMSDB['bookings']> = { updated_at: new Date() };
    if (input.customerId !== undefined) patch.customer_id = input.customerId;
    if (input.contractId !== undefined) patch.contract_id = input.contractId;
    if (input.agentId !== undefined) patch.agent_id = input.agentId;
    if (input.originStationId !== undefined) patch.origin_station_id = input.originStationId;
    if (input.destinationStationId !== undefined) patch.destination_station_id = input.destinationStationId;
    if (input.routeId !== undefined) patch.route_id = input.routeId;
    if (input.requiredVehicleTypeId !== undefined) patch.required_vehicle_type_id = input.requiredVehicleTypeId;
    if (input.status !== undefined) patch.status = input.status;
    if (input.cargoDescription !== undefined) patch.cargo_description = input.cargoDescription;
    if (input.cargoWeightTons !== undefined) patch.cargo_weight_tons = input.cargoWeightTons;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.pickupDate !== undefined) patch.pickup_date = input.pickupDate;
    if (input.deliveryDueDate !== undefined) patch.delivery_due_date = input.deliveryDueDate;
    if (input.finalFreightRate !== undefined) patch.final_freight_rate = input.finalFreightRate;
    if (input.taxAmount !== undefined) patch.tax_amount = input.taxAmount;
    if (input.totalCustomerAmount !== undefined) patch.total_customer_amount = input.totalCustomerAmount;
    if (input.requiresRateApproval !== undefined) patch.requires_rate_approval = input.requiresRateApproval;
    if (input.approvedByUserId !== undefined) patch.approved_by_user_id = input.approvedByUserId;
    if (input.approvedAt !== undefined) patch.approved_at = input.approvedAt;
    if (input.cancelReason !== undefined) patch.cancel_reason = input.cancelReason;
    await this.db.updateTable('bookings').set(patch).where('id', '=', bookingId).executeTakeFirst();
    return this.findById(bookingId);
  }

  getPricingSnapshot(bookingId: number) {
    return this.db
      .selectFrom('booking_pricing_snapshots')
      .select([
        'id as id',
        'booking_id as bookingId',
        'fuel_price_snapshot_id as fuelPriceSnapshotId',
        'fuel_price_per_liter as fuelPricePerLiter',
        'expected_liters as expectedLiters',
        'reserve_liters as reserveLiters',
        'estimated_fuel_cost as estimatedFuelCost',
        'internal_overhead_cost as internalOverheadCost',
        'agent_commission_estimate as agentCommissionEstimate',
        'suggested_freight_rate as suggestedFreightRate',
        'final_freight_rate as finalFreightRate',
        'estimated_margin_amount as estimatedMarginAmount',
        'estimated_margin_percent as estimatedMarginPercent',
        'pricing_source as pricingSource',
        'created_at as createdAt',
      ])
      .where('booking_id', '=', bookingId)
      .executeTakeFirst();
  }

  customerExists(customerId: number) {
    return this.db.selectFrom('customers').select(['id', 'customer_type as customerType']).where('id', '=', customerId).where('is_active', '=', true).executeTakeFirst();
  }

  agentById(agentId: number) {
    return this.db
      .selectFrom('agents')
      .select(['id', 'commission_type as commissionType', 'commission_value as commissionValue'])
      .where('id', '=', agentId)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  routeById(routeId: number) {
    return this.db.selectFrom('routes').select(['id', 'origin_station_id as originStationId', 'destination_station_id as destinationStationId']).where('id', '=', routeId).where('is_active', '=', true).executeTakeFirst();
  }

  routeByStations(originStationId: number, destinationStationId: number) {
    return this.db.selectFrom('routes').select(['id', 'origin_station_id as originStationId', 'destination_station_id as destinationStationId']).where('origin_station_id', '=', originStationId).where('destination_station_id', '=', destinationStationId).where('is_active', '=', true).executeTakeFirst();
  }

  stationExists(stationId: number) {
    return this.db.selectFrom('stations').select('id').where('id', '=', stationId).where('is_active', '=', true).executeTakeFirst();
  }

  vehicleTypeExists(vehicleTypeId: number) {
    return this.db.selectFrom('vehicle_types').select('id').where('id', '=', vehicleTypeId).where('is_active', '=', true).executeTakeFirst();
  }

  latestFuelPrice(fuelType: string) {
    return this.db
      .selectFrom('fuel_price_snapshots')
      .select(['id', 'price_per_liter as pricePerLiter'])
      .where('fuel_type', '=', fuelType)
      .orderBy('effective_at desc')
      .executeTakeFirst();
  }

  routeFuelProfile(routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('route_fuel_profiles')
      .select(['expected_liters as expectedLiters', 'reserve_liters as reserveLiters'])
      .where('route_id', '=', routeId)
      .where('vehicle_type_id', '=', vehicleTypeId)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  routeOverheadProfile(routeId: number, vehicleTypeId: number) {
    return this.db
      .selectFrom('route_overhead_profiles')
      .select(['total_overhead as totalOverhead'])
      .where('route_id', '=', routeId)
      .where('vehicle_type_id', '=', vehicleTypeId)
      .where('is_active', '=', true)
      .executeTakeFirst();
  }

  activeContractRate(customerId: number, routeId: number, vehicleTypeId: number, effectiveDate: Date) {
    return this.db
      .selectFrom('contract_rates')
      .innerJoin('customer_contracts', 'customer_contracts.id', 'contract_rates.contract_id')
      .select([
        'contract_rates.id as id',
        'contract_rates.contract_id as contractId',
        'contract_rates.base_freight_rate as baseFreightRate',
        'contract_rates.minimum_margin_percent as minimumMarginPercent',
        'contract_rates.loading_charges as loadingCharges',
        'contract_rates.unloading_charges as unloadingCharges',
        'contract_rates.tax_percent as taxPercent',
        'customer_contracts.rate_model as rateModel',
        'customer_contracts.fuel_adjustment_enabled as fuelAdjustmentEnabled',
        'customer_contracts.fuel_base_price as fuelBasePrice',
        'customer_contracts.fuel_adjustment_per_liter as fuelAdjustmentPerLiter',
      ])
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
}
