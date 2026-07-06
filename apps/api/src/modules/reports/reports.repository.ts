import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import { sql, type Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

@Injectable()
export class ReportsRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  async dashboard() {
    const [bookings, activeTrips, vehicles, receivables, fuelPayables, agentPayables, actualFuel, driverCash, revenue] = await Promise.all([
      this.db.selectFrom('bookings').select((eb) => eb.fn.countAll<number>().as('total')).executeTakeFirst(),
      this.db.selectFrom('master_trips').select((eb) => eb.fn.countAll<number>().as('total')).where('status', 'in', ['planned', 'in_transit']).executeTakeFirst(),
      this.db.selectFrom('vehicles').select(['status']).select((eb) => eb.fn.countAll<number>().as('total')).groupBy('status').execute(),
      this.db.selectFrom('customer_invoices').select(sql<string>`coalesce(sum(balance_amount), 0)`.as('total')).where('status', 'in', ['issued', 'partially_paid']).executeTakeFirst(),
      this.db.selectFrom('fuel_vendor_invoices').select(sql<string>`coalesce(sum(balance_amount), 0)`.as('total')).where('status', 'in', ['open', 'partially_paid']).executeTakeFirst(),
      this.db.selectFrom('agent_commissions').select(sql<string>`coalesce(sum(commission_amount), 0)`.as('total')).where('status', 'in', ['pending', 'approved']).executeTakeFirst(),
      this.db.selectFrom('fuel_slips').select(sql<string>`coalesce(sum(total_amount), 0)`.as('total')).where('status', 'in', ['verified', 'invoiced', 'paid']).executeTakeFirst(),
      this.db.selectFrom('driver_expenses').select(sql<string>`coalesce(sum(amount), 0)`.as('total')).where('status', '=', 'approved').executeTakeFirst(),
      this.db.selectFrom('customer_invoices').select(sql<string>`coalesce(sum(total_amount), 0)`.as('total')).where('status', 'in', ['issued', 'partially_paid', 'paid']).executeTakeFirst(),
    ]);

    const vehicleAvailability = vehicles.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.total ?? 0);
      return acc;
    }, {});

    const totalRevenue = Number(revenue?.total ?? 0);
    const totalFuelCost = Number(actualFuel?.total ?? 0);
    const totalDriverCash = Number(driverCash?.total ?? 0);
    const totalAgentPayable = Number(agentPayables?.total ?? 0);

    return {
      bookingsCount: Number(bookings?.total ?? 0),
      activeTripsCount: Number(activeTrips?.total ?? 0),
      vehicleAvailability,
      customerReceivableAmount: money(Number(receivables?.total ?? 0)),
      fuelVendorPayableAmount: money(Number(fuelPayables?.total ?? 0)),
      agentCommissionPayableAmount: money(totalAgentPayable),
      actualFuelCostAmount: money(totalFuelCost),
      approvedDriverCashCostAmount: money(totalDriverCash),
      invoicedRevenueAmount: money(totalRevenue),
      estimatedProfitAmount: money(totalRevenue - totalFuelCost - totalDriverCash - totalAgentPayable),
    };
  }
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
