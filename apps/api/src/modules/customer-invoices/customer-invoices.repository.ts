import { Inject, Injectable } from '@nestjs/common';
import type { DB as EMSDB } from '@ems/db';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { DB } from '../../database/database.tokens';

export type CustomerInvoiceFilters = { search?: string; status?: string; customerId?: number; bookingId?: number };
export type CustomerPaymentFilters = { search?: string; customerId?: number; invoiceId?: number };
export type CustomerInvoiceCreateInput = {
  invoiceNumber: string;
  bookingId: number;
  customerId: number;
  invoiceDate: string;
  dueDate: string | null;
  subtotalAmount: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  createdByUserId: number | null;
};
export type CustomerPaymentCreateInput = {
  paymentNumber: string;
  customerInvoiceId: number;
  customerId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  receivedByUserId: number | null;
};

@Injectable()
export class CustomerInvoicesRepository {
  constructor(@Inject(DB) private readonly db: Kysely<EMSDB>) {}

  private invoiceBase() {
    return this.db
      .selectFrom('customer_invoices')
      .innerJoin('bookings', 'bookings.id', 'customer_invoices.booking_id')
      .innerJoin('customers', 'customers.id', 'customer_invoices.customer_id')
      .select([
        'customer_invoices.id as id',
        'customer_invoices.invoice_number as invoiceNumber',
        'customer_invoices.booking_id as bookingId',
        'bookings.booking_number as bookingNumber',
        'customer_invoices.customer_id as customerId',
        'customers.name as customerName',
        'customer_invoices.invoice_date as invoiceDate',
        'customer_invoices.due_date as dueDate',
        'customer_invoices.subtotal_amount as subtotalAmount',
        'customer_invoices.tax_amount as taxAmount',
        'customer_invoices.total_amount as totalAmount',
        'customer_invoices.paid_amount as paidAmount',
        'customer_invoices.balance_amount as balanceAmount',
        'customer_invoices.status as status',
        'customer_invoices.notes as notes',
        'customer_invoices.issued_at as issuedAt',
        'customer_invoices.created_by_user_id as createdByUserId',
        'customer_invoices.created_at as createdAt',
        'customer_invoices.updated_at as updatedAt',
      ]);
  }

  private paymentBase() {
    return this.db
      .selectFrom('customer_payments')
      .innerJoin('customer_invoices', 'customer_invoices.id', 'customer_payments.customer_invoice_id')
      .innerJoin('customers', 'customers.id', 'customer_payments.customer_id')
      .select([
        'customer_payments.id as id',
        'customer_payments.payment_number as paymentNumber',
        'customer_payments.customer_invoice_id as customerInvoiceId',
        'customer_invoices.invoice_number as invoiceNumber',
        'customer_payments.customer_id as customerId',
        'customers.name as customerName',
        'customer_payments.amount as amount',
        'customer_payments.payment_date as paymentDate',
        'customer_payments.payment_method as paymentMethod',
        'customer_payments.reference_number as referenceNumber',
        'customer_payments.notes as notes',
        'customer_payments.received_by_user_id as receivedByUserId',
        'customer_payments.created_at as createdAt',
        'customer_payments.updated_at as updatedAt',
      ]);
  }

  findInvoices(filters: CustomerInvoiceFilters, offset: number, limit: number) {
    return this.invoiceBase()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('customer_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('customer_invoices.status', '=', filters.status!))
      .$if(Boolean(filters.customerId), (qb) => qb.where('customer_invoices.customer_id', '=', filters.customerId!))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('customer_invoices.booking_id', '=', filters.bookingId!))
      .orderBy('customer_invoices.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countInvoices(filters: CustomerInvoiceFilters) {
    const row = await this.db
      .selectFrom('customer_invoices')
      .innerJoin('bookings', 'bookings.id', 'customer_invoices.booking_id')
      .innerJoin('customers', 'customers.id', 'customer_invoices.customer_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('customer_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('bookings.booking_number', 'ilike', `%${filters.search}%`),
        eb('customers.name', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.status), (qb) => qb.where('customer_invoices.status', '=', filters.status!))
      .$if(Boolean(filters.customerId), (qb) => qb.where('customer_invoices.customer_id', '=', filters.customerId!))
      .$if(Boolean(filters.bookingId), (qb) => qb.where('customer_invoices.booking_id', '=', filters.bookingId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findInvoiceById(id: number) {
    return this.invoiceBase().where('customer_invoices.id', '=', id).executeTakeFirst();
  }

  findInvoiceByNumber(invoiceNumber: string) {
    return this.db.selectFrom('customer_invoices').select('id').where('invoice_number', '=', invoiceNumber).executeTakeFirst();
  }

  findInvoiceByBookingId(bookingId: number) {
    return this.db.selectFrom('customer_invoices').select('id').where('booking_id', '=', bookingId).executeTakeFirst();
  }

  bookingForInvoice(bookingId: number) {
    return this.db
      .selectFrom('bookings')
      .select(['id', 'booking_number as bookingNumber', 'customer_id as customerId', 'status', 'final_freight_rate as finalFreightRate', 'tax_amount as taxAmount', 'total_customer_amount as totalCustomerAmount'])
      .where('id', '=', bookingId)
      .executeTakeFirst();
  }

  async createInvoice(input: CustomerInvoiceCreateInput) {
    const rowId = await this.db.transaction().execute(async (trx) => {
      const insert: Insertable<EMSDB['customer_invoices']> = {
        invoice_number: input.invoiceNumber,
        booking_id: input.bookingId,
        customer_id: input.customerId,
        invoice_date: input.invoiceDate,
        due_date: input.dueDate,
        subtotal_amount: input.subtotalAmount,
        tax_amount: input.taxAmount,
        total_amount: input.totalAmount,
        paid_amount: '0.00',
        balance_amount: input.totalAmount,
        status: 'issued',
        notes: input.notes,
        issued_at: new Date(),
        created_by_user_id: input.createdByUserId,
      };
      const row = await trx.insertInto('customer_invoices').values(insert).returning('id').executeTakeFirstOrThrow();
      await trx.updateTable('bookings').set({ status: 'invoiced', updated_at: new Date() }).where('id', '=', input.bookingId).executeTakeFirst();
      return row.id;
    });
    return this.findInvoiceById(rowId);
  }

  findPayments(filters: CustomerPaymentFilters, offset: number, limit: number) {
    return this.paymentBase()
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('customer_payments.payment_number', 'ilike', `%${filters.search}%`),
        eb('customer_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('customer_payments.reference_number', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.customerId), (qb) => qb.where('customer_payments.customer_id', '=', filters.customerId!))
      .$if(Boolean(filters.invoiceId), (qb) => qb.where('customer_payments.customer_invoice_id', '=', filters.invoiceId!))
      .orderBy('customer_payments.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();
  }

  async countPayments(filters: CustomerPaymentFilters) {
    const row = await this.db
      .selectFrom('customer_payments')
      .innerJoin('customer_invoices', 'customer_invoices.id', 'customer_payments.customer_invoice_id')
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .$if(Boolean(filters.search), (qb) => qb.where((eb) => eb.or([
        eb('customer_payments.payment_number', 'ilike', `%${filters.search}%`),
        eb('customer_invoices.invoice_number', 'ilike', `%${filters.search}%`),
        eb('customer_payments.reference_number', 'ilike', `%${filters.search}%`),
      ])))
      .$if(Boolean(filters.customerId), (qb) => qb.where('customer_payments.customer_id', '=', filters.customerId!))
      .$if(Boolean(filters.invoiceId), (qb) => qb.where('customer_payments.customer_invoice_id', '=', filters.invoiceId!))
      .executeTakeFirst();
    return Number(row?.total ?? 0);
  }

  findPaymentById(id: number) {
    return this.paymentBase().where('customer_payments.id', '=', id).executeTakeFirst();
  }

  findPaymentByNumber(paymentNumber: string) {
    return this.db.selectFrom('customer_payments').select('id').where('payment_number', '=', paymentNumber).executeTakeFirst();
  }

  async createPayment(input: CustomerPaymentCreateInput) {
    const rowId = await this.db.transaction().execute(async (trx) => {
      const invoice = await trx.selectFrom('customer_invoices').select(['id', 'booking_id as bookingId', 'customer_id as customerId', 'paid_amount as paidAmount', 'balance_amount as balanceAmount', 'total_amount as totalAmount', 'status']).where('id', '=', input.customerInvoiceId).executeTakeFirstOrThrow();
      const nextPaid = Number(invoice.paidAmount) + Number(input.amount);
      const nextBalance = Math.max(0, Number(invoice.totalAmount) - nextPaid);
      const nextStatus = nextBalance <= 0 ? 'paid' : 'partially_paid';
      const insert: Insertable<EMSDB['customer_payments']> = {
        payment_number: input.paymentNumber,
        customer_invoice_id: input.customerInvoiceId,
        customer_id: input.customerId,
        amount: input.amount,
        payment_date: input.paymentDate,
        payment_method: input.paymentMethod,
        reference_number: input.referenceNumber,
        notes: input.notes,
        received_by_user_id: input.receivedByUserId,
      };
      const row = await trx.insertInto('customer_payments').values(insert).returning('id').executeTakeFirstOrThrow();
      await trx.updateTable('customer_invoices').set({ paid_amount: money(nextPaid), balance_amount: money(nextBalance), status: nextStatus, updated_at: new Date() }).where('id', '=', input.customerInvoiceId).executeTakeFirst();
      if (nextStatus === 'paid') {
        await trx.updateTable('bookings').set({ status: 'paid', updated_at: new Date() }).where('id', '=', invoice.bookingId).executeTakeFirst();
      }
      return row.id;
    });
    return this.findPaymentById(rowId);
  }
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
