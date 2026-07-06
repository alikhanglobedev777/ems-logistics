import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FuelSlipStatus, FuelVendorInvoiceStatus, PaymentMethod } from '@ems/shared';
import { optionalDate, optionalDecimal, optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toFuelVendorInvoiceResponse, toFuelVendorInvoicesListResponse, toFuelVendorPaymentResponse, toFuelVendorPaymentsListResponse } from './fuel-vendor-invoices.mapper';
import { FuelVendorInvoicesRepository } from './fuel-vendor-invoices.repository';

const INVOICE_STATUSES = new Set<string>(Object.values(FuelVendorInvoiceStatus));
const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));

type CreateFuelVendorInvoiceRequest = { fuelVendorId?: unknown; slipIds?: unknown; vendorInvoiceNumber?: unknown; invoiceDate?: unknown; dueDate?: unknown; notes?: unknown; createdByUserId?: unknown };
type PayFuelVendorInvoiceRequest = { amount?: unknown; paymentDate?: unknown; paymentMethod?: unknown; referenceNumber?: unknown; notes?: unknown; paidByUserId?: unknown };

@Injectable()
export class FuelVendorInvoicesService {
  constructor(private readonly repo: FuelVendorInvoicesRepository) {}

  async listInvoices(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const status = optionalString(query.status) ?? undefined;
    if (status && !INVOICE_STATUSES.has(status)) throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid fuel vendor invoice status' } });
    const filters = {
      search: optionalString(query.search) ?? undefined,
      status,
      vendorId: optionalPositiveInt(query.vendorId, 'vendorId'),
    };
    const [rows, total] = await Promise.all([this.repo.findInvoices(filters, p.offset, p.limit), this.repo.countInvoices(filters)]);
    return toFuelVendorInvoicesListResponse(rows, p.page, p.limit, total);
  }

  async getInvoice(idValue: unknown) {
    const row = await this.repo.findInvoiceById(positiveInt(idValue, 'fuelVendorInvoiceId'));
    if (!row) throw this.invoiceNotFound();
    return toFuelVendorInvoiceResponse(row);
  }

  async createInvoice(body: CreateFuelVendorInvoiceRequest) {
    const fuelVendorId = positiveInt(body.fuelVendorId, 'fuelVendorId');
    const slipIds = parsePositiveIntArray(body.slipIds, 'slipIds');
    const slips = await this.repo.verifiedSlipsByIds(slipIds);
    if (slips.length !== slipIds.length) {
      throw new BadRequestException({ error: { code: 'FUEL_SLIPS_NOT_FOUND', message: 'All selected fuel slips must exist' } });
    }
    for (const slip of slips) {
      if (slip.fuelVendorId !== fuelVendorId) throw new BadRequestException({ error: { code: 'FUEL_VENDOR_MISMATCH', message: 'All slips must belong to selected fuel vendor' } });
      if (slip.status !== FuelSlipStatus.VERIFIED) throw new BadRequestException({ error: { code: 'FUEL_SLIP_NOT_VERIFIED', message: 'Only verified fuel slips can be invoiced' } });
    }
    const totalAmount = slips.reduce((sum, slip) => sum + Number(slip.totalAmount), 0);
    const row = await this.repo.createInvoice({
      invoiceNumber: await this.generateInvoiceNumber(),
      fuelVendorId,
      vendorInvoiceNumber: optionalString(body.vendorInvoiceNumber),
      invoiceDate: optionalDate(body.invoiceDate, 'invoiceDate') ?? new Date().toISOString().slice(0, 10),
      dueDate: optionalDate(body.dueDate, 'dueDate'),
      totalAmount: money(totalAmount),
      notes: optionalString(body.notes),
      createdByUserId: optionalPositiveInt(body.createdByUserId, 'createdByUserId') ?? null,
      slipIds,
    });
    return toFuelVendorInvoiceResponse(row!);
  }

  async listPayments(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      vendorId: optionalPositiveInt(query.vendorId, 'vendorId'),
      invoiceId: optionalPositiveInt(query.invoiceId, 'invoiceId'),
    };
    const [rows, total] = await Promise.all([this.repo.findPayments(filters, p.offset, p.limit), this.repo.countPayments(filters)]);
    return toFuelVendorPaymentsListResponse(rows, p.page, p.limit, total);
  }

  async getPayment(idValue: unknown) {
    const row = await this.repo.findPaymentById(positiveInt(idValue, 'fuelVendorPaymentId'));
    if (!row) throw new NotFoundException({ error: { code: 'FUEL_VENDOR_PAYMENT_NOT_FOUND', message: 'Fuel vendor payment not found' } });
    return toFuelVendorPaymentResponse(row);
  }

  async payInvoice(invoiceIdValue: unknown, body: PayFuelVendorInvoiceRequest) {
    const invoiceId = positiveInt(invoiceIdValue, 'fuelVendorInvoiceId');
    const invoice = await this.repo.findInvoiceById(invoiceId);
    if (!invoice) throw this.invoiceNotFound();
    if (invoice.status === FuelVendorInvoiceStatus.PAID || invoice.status === FuelVendorInvoiceStatus.CANCELLED) {
      throw new BadRequestException({ error: { code: 'FUEL_VENDOR_INVOICE_NOT_PAYABLE', message: 'Invoice is already paid or cancelled' } });
    }
    const amount = optionalDecimal(body.amount, 'amount');
    if (amount === null || Number(amount) <= 0) throw new BadRequestException({ error: { code: 'INVALID_PAYMENT_AMOUNT', message: 'amount must be greater than zero' } });
    if (Number(amount) > Number(invoice.balanceAmount)) throw new BadRequestException({ error: { code: 'PAYMENT_EXCEEDS_BALANCE', message: 'Payment amount cannot exceed invoice balance' } });
    const paymentMethod = requiredString(body.paymentMethod ?? PaymentMethod.BANK_TRANSFER, 'paymentMethod');
    if (!PAYMENT_METHODS.has(paymentMethod)) throw new BadRequestException({ error: { code: 'INVALID_PAYMENT_METHOD', message: 'paymentMethod is invalid' } });
    const row = await this.repo.createPayment({
      paymentNumber: await this.generatePaymentNumber(),
      fuelVendorInvoiceId: invoice.id,
      fuelVendorId: invoice.fuelVendorId,
      amount: money(Number(amount)),
      paymentDate: optionalDate(body.paymentDate, 'paymentDate') ?? new Date().toISOString().slice(0, 10),
      paymentMethod,
      referenceNumber: optionalString(body.referenceNumber),
      notes: optionalString(body.notes),
      paidByUserId: optionalPositiveInt(body.paidByUserId, 'paidByUserId') ?? null,
    });
    return toFuelVendorPaymentResponse(row!);
  }

  private async generateInvoiceNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `FVINV-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findInvoiceByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'FUEL_VENDOR_INVOICE_NUMBER_FAILED', message: 'Could not generate fuel vendor invoice number' } });
  }

  private async generatePaymentNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    for (let i = 1; i <= 20; i += 1) {
      const candidate = `FVPAY-${stamp}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      if (!(await this.repo.findPaymentByNumber(candidate))) return candidate;
    }
    throw new BadRequestException({ error: { code: 'FUEL_VENDOR_PAYMENT_NUMBER_FAILED', message: 'Could not generate fuel vendor payment number' } });
  }

  private invoiceNotFound() {
    return new NotFoundException({ error: { code: 'FUEL_VENDOR_INVOICE_NOT_FOUND', message: 'Fuel vendor invoice not found' } });
  }
}

function parsePositiveIntArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException({ error: { code: 'INVALID_ARRAY', message: `${fieldName} must be a non-empty array` } });
  }
  return value.map((item, index) => positiveInt(item, `${fieldName}[${index}]`));
}

function money(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}
