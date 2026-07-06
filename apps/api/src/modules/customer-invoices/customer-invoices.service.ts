import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, CustomerInvoiceStatus, PaymentMethod } from '@ems/shared';
import { optionalDate, optionalDecimal, optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toCustomerInvoiceResponse, toCustomerInvoicesListResponse, toCustomerPaymentResponse, toCustomerPaymentsListResponse } from './customer-invoices.mapper';
import { CustomerInvoicesRepository } from './customer-invoices.repository';

const INVOICE_STATUSES = new Set<string>(Object.values(CustomerInvoiceStatus));
const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

type CreateCustomerInvoiceRequest = { bookingId?: unknown; invoiceDate?: unknown; dueDate?: unknown; notes?: unknown; createdByUserId?: unknown };
type ReceiveCustomerPaymentRequest = { amount?: unknown; paymentDate?: unknown; paymentMethod?: unknown; referenceNumber?: unknown; notes?: unknown; receivedByUserId?: unknown };

@Injectable()
export class CustomerInvoicesService {
  constructor(private readonly repo: CustomerInvoicesRepository) {}

  async listInvoices(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const status = optionalString(query.status) ?? undefined;
    if (status && !INVOICE_STATUSES.has(status)) throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid invoice status' } });
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status,
      customerId: optionalPositiveInt(query.customerId, 'customerId'),
      bookingId: optionalPositiveInt(query.bookingId, 'bookingId'),
    };
    const [rows, total] = await Promise.all([this.repo.findInvoices(filters, p.offset, p.limit), this.repo.countInvoices(filters)]);
    return toCustomerInvoicesListResponse(rows, p.page, p.limit, total);
  }

  async getInvoice(idValue: unknown) {
    const row = await this.repo.findInvoiceById(positiveInt(idValue, 'customerInvoiceId'));
    if (!row) throw this.invoiceNotFound();
    return toCustomerInvoiceResponse(row);
  }

  async createInvoice(body: CreateCustomerInvoiceRequest) {
    const bookingId = positiveInt(body.bookingId, 'bookingId');
    const booking = await this.repo.bookingForInvoice(bookingId);
    if (!booking) throw new BadRequestException({ error: { code: 'BOOKING_NOT_FOUND', message: 'Booking does not exist' } });
    if (booking.status !== BookingStatus.POD_UPLOADED) {
      throw new BadRequestException({ error: { code: 'BOOKING_NOT_READY_FOR_INVOICE', message: 'Customer invoice requires POD uploaded status' } });
    }
    if (await this.repo.findInvoiceByBookingId(bookingId)) {
      throw new BadRequestException({ error: { code: 'INVOICE_ALREADY_EXISTS', message: 'Invoice already exists for this booking' } });
    }
    const row = await this.repo.createInvoice({
      invoiceNumber: await this.generateInvoiceNumber(),
      bookingId,
      customerId: booking.customerId,
      invoiceDate: optionalDate(body.invoiceDate, 'invoiceDate') ?? new Date().toISOString().slice(0, 10),
      dueDate: optionalDate(body.dueDate, 'dueDate'),
      subtotalAmount: money(Number(booking.finalFreightRate)),
      taxAmount: money(Number(booking.taxAmount)),
      totalAmount: money(Number(booking.totalCustomerAmount)),
      notes: optionalString(body.notes),
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
    });
    return toCustomerInvoiceResponse(row!);
  }

  async listPayments(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      customerId: optionalPositiveInt(query.customerId, 'customerId'),
      invoiceId: optionalPositiveInt(query.invoiceId, 'invoiceId'),
    };
    const [rows, total] = await Promise.all([this.repo.findPayments(filters, p.offset, p.limit), this.repo.countPayments(filters)]);
    return toCustomerPaymentsListResponse(rows, p.page, p.limit, total);
  }

  async getPayment(idValue: unknown) {
    const row = await this.repo.findPaymentById(positiveInt(idValue, 'customerPaymentId'));
    if (!row) throw new NotFoundException({ error: { code: 'CUSTOMER_PAYMENT_NOT_FOUND', message: 'Customer payment not found' } });
    return toCustomerPaymentResponse(row);
  }

  async receivePayment(invoiceIdValue: unknown, body: ReceiveCustomerPaymentRequest) {
    const invoiceId = positiveInt(invoiceIdValue, 'customerInvoiceId');
    const invoice = await this.repo.findInvoiceById(invoiceId);
    if (!invoice) throw this.invoiceNotFound();
    if (invoice.status === CustomerInvoiceStatus.PAID || invoice.status === CustomerInvoiceStatus.CANCELLED) {
      throw new BadRequestException({ error: { code: 'INVOICE_NOT_PAYABLE', message: 'Invoice is already paid or cancelled' } });
    }
    const amount = optionalDecimal(body.amount, 'amount');
    if (amount === null || Number(amount) <= 0) {
      throw new BadRequestException({ error: { code: 'INVALID_PAYMENT_AMOUNT', message: 'amount must be greater than zero' } });
    }
    if (Number(amount) > Number(invoice.balanceAmount)) {
      throw new BadRequestException({ error: { code: 'PAYMENT_EXCEEDS_BALANCE', message: 'Payment amount cannot exceed invoice balance' } });
    }
    const paymentMethod = requiredString(body.paymentMethod ?? PaymentMethod.CASH, 'paymentMethod');
    if (!PAYMENT_METHODS.has(paymentMethod)) throw new BadRequestException({ error: { code: 'INVALID_PAYMENT_METHOD', message: 'paymentMethod is invalid' } });
    const row = await this.repo.createPayment({
      paymentNumber: await this.generatePaymentNumber(),
      customerInvoiceId: invoice.id,
      customerId: invoice.customerId,
      amount: money(Number(amount)),
      paymentDate: optionalDate(body.paymentDate, 'paymentDate') ?? new Date().toISOString().slice(0, 10),
      paymentMethod,
      referenceNumber: optionalString(body.referenceNumber),
      notes: optionalString(body.notes),
      receivedByUserId: optionalPositiveInt(body.receivedByUserId, 'receivedByUserId') ?? null,
    });
    return toCustomerPaymentResponse(row!);
  }

  private async generateInvoiceNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `CINV-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findInvoiceByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'CUSTOMER_INVOICE_NUMBER_FAILED', message: 'Could not generate customer invoice number' } });
  }

  private async generatePaymentNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `CPAY-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findPaymentByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'CUSTOMER_PAYMENT_NUMBER_FAILED', message: 'Could not generate customer payment number' } });
  }

  private invoiceNotFound() {
    return new NotFoundException({ error: { code: 'CUSTOMER_INVOICE_NOT_FOUND', message: 'Customer invoice not found' } });
  }
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
