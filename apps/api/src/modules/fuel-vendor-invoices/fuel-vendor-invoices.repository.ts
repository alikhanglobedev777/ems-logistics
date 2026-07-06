import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely } from 'kysely';
import { DB } from '../../database/database.tokens';

export type FuelVendorInvoiceFilters = { search?: string; status?: string; vendorId?: number };
export type FuelVendorPaymentFilters = { search?: string; vendorId?: number; invoiceId?: number };
export type FuelVendorInvoiceCreateInput = {
  invoiceNumber: string;
  fuelVendorId: number;
  vendorInvoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: string;
  notes: string | null;
  createdByUserId: number | null;
  slipIds: number[];
};
export type FuelVendorPaymentCreateInput = {
  paymentNumber: string;
  fuelVendorInvoiceId: number;
  fuelVendorId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  paidByUserId: number | null;
};

@Injectable()
export class FuelVendorInvoicesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private invoiceBase() {
    return this.db
      .selectFrom('fuel_vendor_invoices')
      .innerJoin('fuel_vendors', 'fuel_vendors.id', 'fuel_vendor_invoices.fuel_vendor_id')
      .select([
        'fuel_vendor_invoices.id as id',
        'fuel_vendor_invoices.invoice_number as invoiceNumber',
        'fuel_vendor_invoices.fuel_vendor_id as fuelVendorId',
        'fuel_vendors.name as fuelVendorName',
        'fuel_vendor_invoices.vendor_invoice_number as vendorInvoiceNumber',
        'fuel_vendor_invoices.invoice_date as invoiceDate',
        'fuel_vendor_invoices.due_date as dueDate',
        'fuel_vendor_invoices.total_amount as totalAmount',
        'fuel_vendor_invoices.paid_amount as paidAmount',
        'fuel_vendor_invoices.balance_amount as balanceAmount',
        'fuel_vendor_invoices.status as status',
        'fuel_vendor_invoices.notes as notes',
        'fuel_vendor_invoices.created_by_user_id as createdByUserId',
        'fuel_vendor_invoices.created_at as createdAt',
        'fuel_vendor_invoices.updated_at as updatedAt',
      ]);
  }

  private paymentBase() {
    return this.db
      .selectFrom('fuel_vendor_payments')
      .innerJoin('fuel_vendor_invoices', 'fuel_vendor_invoices.id', 'fuel_vendor_payments.fuel_vendor_invoice_id')
      .innerJoin('fuel_vendors', 'fuel_vendors.id', 'fuel_vendor_payments.fuel_vendor_id')
      .select([
        'fuel_vendor_payments.id as id',
        'fuel_vendor_payments.payment_number as paymentNumber',
        'fuel_vendor_payments.fuel_vendor_invoice_id as fuelVendorInvoiceId',
        'fuel_vendor_invoices.invoice_number as invoiceNumber',
        'fuel_vendor_payments.fuel_vendor_id as fuelVendorId',
        'fuel_vendors.name as fuelVendorName',
        'fuel_vendor_payments.amount as amount',
        'fuel_vendor_payments.payment_date as paymentDate',
        'fuel_vendor_payments.payment_method as paymentMethod',
        'fuel_vendor_payments.reference_number as referenceNumber',
        'fuel_vendor_payments.notes as notes',
        'fuel_vendor_payments.paid_by_user_id as paidByUserId',
        'fuel_vendor_payments.created_at as createdAt',
        'fuel_vendor_payments.updated_at as updatedAt',
      ]);
  }

  findInvoices(filters: FuelVendorInvoiceFilters, offset: number, limit: number) {
    return this.invoiceBase()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('fuel_vendor_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_invoices.vendor_invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendors.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('fuel_vendor_invoices.status', '=', filters.status!))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_vendor_invoices.fuel_vendor_id', '=', filters.vendorId!))
      .orderBy('fuel_vendor_invoices.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countInvoices(filters: FuelVendorInvoiceFilters) {
    const row = await this.db
      .selectFrom('fuel_vendor_invoices')
      .innerJoin('fuel_vendors', 'fuel_vendors.id', 'fuel_vendor_invoices.fuel_vendor_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('fuel_vendor_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_invoices.vendor_invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendors.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('fuel_vendor_invoices.status', '=', filters.status!))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_vendor_invoices.fuel_vendor_id', '=', filters.vendorId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findInvoiceById(id: number) {
    return this.invoiceBase().where('fuel_vendor_invoices.id', '=', id).executeTakeFirst();
  }

  findInvoiceByNumber(invoiceNumber: string) {
    return this.db.selectFrom('fuel_vendor_invoices').select('id').where('invoice_number', '=', invoiceNumber).executeTakeFirst();
  }

  verifiedSlipsByIds(slipIds: number[]) {
    return this.db.selectFrom('fuel_slips').select(['id', 'fuel_vendor_id as fuelVendorId', 'status', 'total_amount as totalAmount']).where('id', 'in', slipIds).execute();
  }

  async createInvoice(input: FuelVendorInvoiceCreateInput) {
    const rowId = await this.db.transaction().execute(async (trx) => {
      const insert: Insertable<EMSDB['fuel_vendor_invoices']> = {
        invoice_number: input.invoiceNumber,
        fuel_vendor_id: input.fuelVendorId,
        vendor_invoice_number: input.vendorInvoiceNumber,
        invoice_date: input.invoiceDate,
        due_date: input.dueDate,
        total_amount: input.totalAmount,
        paid_amount: '0.00',
        balance_amount: input.totalAmount,
        status: 'open',
        notes: input.notes,
        created_by_user_id: input.createdByUserId,
      };
      const row = await trx.insertInto('fuel_vendor_invoices').values(insert).returning('id').executeTakeFirstOrThrow();
      const slips = await trx.selectFrom('fuel_slips').select(['id', 'total_amount as totalAmount']).where('id', 'in', input.slipIds).execute();
      await trx.insertInto('fuel_vendor_invoice_items').values(slips.map((slip) => ({ fuel_vendor_invoice_id: row.id, fuel_slip_id: slip.id, amount: slip.totalAmount }))).execute();
      await trx.updateTable('fuel_slips').set({ status: 'invoiced', updated_at: new Date() }).where('id', 'in', input.slipIds).execute();
      return row.id;
    });
    return this.findInvoiceById(rowId);
  }

  findPayments(filters: FuelVendorPaymentFilters, offset: number, limit: number) {
    return this.paymentBase()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('fuel_vendor_payments.payment_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_payments.reference_number', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_vendor_payments.fuel_vendor_id', '=', filters.vendorId!))
      .$if(Boolean(filters.invoiceId), (qb) => qb.where('fuel_vendor_payments.fuel_vendor_invoice_id', '=', filters.invoiceId!))
      .orderBy('fuel_vendor_payments.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countPayments(filters: FuelVendorPaymentFilters) {
    const row = await this.db
      .selectFrom('fuel_vendor_payments')
      .innerJoin('fuel_vendor_invoices', 'fuel_vendor_invoices.id', 'fuel_vendor_payments.fuel_vendor_invoice_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('fuel_vendor_payments.payment_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('fuel_vendor_payments.reference_number', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.vendorId), (qb) => qb.where('fuel_vendor_payments.fuel_vendor_id', '=', filters.vendorId!))
      .$if(Boolean(filters.invoiceId), (qb) => qb.where('fuel_vendor_payments.fuel_vendor_invoice_id', '=', filters.invoiceId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findPaymentById(id: number) {
    return this.paymentBase().where('fuel_vendor_payments.id', '=', id).executeTakeFirst();
  }

  findPaymentByNumber(paymentNumber: string) {
    return this.db.selectFrom('fuel_vendor_payments').select('id').where('payment_number', '=', paymentNumber).executeTakeFirst();
  }

  async createPayment(input: FuelVendorPaymentCreateInput) {
    const rowId = await this.db.transaction().execute(async (trx) => {
      const invoice = await trx.selectFrom('fuel_vendor_invoices').select(['id', 'paid_amount as paidAmount', 'balance_amount as balanceAmount', 'total_amount as totalAmount', 'status']).where('id', '=', input.fuelVendorInvoiceId).executeTakeFirstOrThrow();
      const nextPaid = Number(invoice.paidAmount) + Number(input.amount);
      const nextBalance = Math.max(0, Number(invoice.totalAmount) - nextPaid);
      const nextStatus = nextBalance <= 0 ? 'paid' : 'partially_paid';
      const insert: Insertable<EMSDB['fuel_vendor_payments']> = {
        payment_number: input.paymentNumber,
        fuel_vendor_invoice_id: input.fuelVendorInvoiceId,
        fuel_vendor_id: input.fuelVendorId,
        amount: input.amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber,
        notes: input.notes,
        paid_by_user_id: input.paidByUserId,
      };
      const row = await trx.insertInto('fuel_vendor_payments').values(insert).returning('id').executeTakeFirstOrThrow();
      await trx.updateTable('fuel_vendor_invoices').set({ paid_amount: money(nextPaid), balance_amount: money(nextBalance), status: nextStatus, updated_at: new Date() }).where('id', '=', input.fuelVendorInvoiceId).executeTakeFirst();
      if (nextStatus === 'paid') {
        await trx.updateTable('fuel_slips').set({ status: 'paid', updated_at: new Date() }).where('id', 'in', trx.selectFrom('fuel_vendor_invoice_items').select('fuel_slip_id').where('fuel_vendor_invoice_id', '=', input.fuelVendorInvoiceId)).execute();
      }
      return row.id;
    });
    return this.findPaymentById(rowId);
  }
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
