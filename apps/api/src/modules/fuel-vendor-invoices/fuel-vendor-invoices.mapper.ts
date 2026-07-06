import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type FuelVendorInvoiceRow = {
  id: number;
  invoiceNumber: string;
  fuelVendorId: number;
  fuelVendorName: string;
  vendorInvoiceNumber: string | null;
  invoiceDate: unknown;
  dueDate: unknown | null;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
  notes: string | null;
  createdByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type FuelVendorPaymentRow = {
  id: number;
  paymentNumber: string;
  fuelVendorInvoiceId: number;
  invoiceNumber: string;
  fuelVendorId: number;
  fuelVendorName: string;
  amount: string;
  paymentDate: unknown;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  paidByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type FuelVendorInvoice = ReturnType<typeof toFuelVendorInvoice>;
export type FuelVendorPayment = ReturnType<typeof toFuelVendorPayment>;
export type FuelVendorInvoiceResponse = { data: FuelVendorInvoice; message: string };
export type FuelVendorInvoicesListResponse = { data: FuelVendorInvoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type FuelVendorPaymentResponse = { data: FuelVendorPayment; message: string };
export type FuelVendorPaymentsListResponse = { data: FuelVendorPayment[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export function toFuelVendorInvoice(row: FuelVendorInvoiceRow) {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    vendor: { id: row.fuelVendorId, name: row.fuelVendorName },
    vendorInvoiceNumber: row.vendorInvoiceNumber,
    invoiceDate: toDateOnly(row.invoiceDate)!,
    dueDate: toDateOnly(row.dueDate),
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    balanceAmount: row.balanceAmount,
    status: row.status,
    notes: row.notes,
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toFuelVendorPayment(row: FuelVendorPaymentRow) {
  return {
    id: row.id,
    paymentNumber: row.paymentNumber,
    invoice: { id: row.fuelVendorInvoiceId, invoiceNumber: row.invoiceNumber },
    vendor: { id: row.fuelVendorId, name: row.fuelVendorName },
    amount: row.amount,
    paymentDate: toDateOnly(row.paymentDate)!,
    paymentMethod: row.paymentMethod,
    referenceNumber: row.referenceNumber,
    notes: row.notes,
    paidByUserId: row.paidByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toFuelVendorInvoiceResponse = (row: FuelVendorInvoiceRow): FuelVendorInvoiceResponse => ({ data: toFuelVendorInvoice(row), message: 'Success' });
export const toFuelVendorPaymentResponse = (row: FuelVendorPaymentRow): FuelVendorPaymentResponse => ({ data: toFuelVendorPayment(row), message: 'Success' });

export function toFuelVendorInvoicesListResponse(rows: FuelVendorInvoiceRow[], page: number, limit: number, total: number): FuelVendorInvoicesListResponse {
  return { data: rows.map(toFuelVendorInvoice), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export function toFuelVendorPaymentsListResponse(rows: FuelVendorPaymentRow[], page: number, limit: number, total: number): FuelVendorPaymentsListResponse {
  return { data: rows.map(toFuelVendorPayment), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
