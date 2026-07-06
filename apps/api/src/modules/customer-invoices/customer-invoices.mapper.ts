import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type CustomerInvoiceRow = {
  id: number;
  invoiceNumber: string;
  bookingId: number;
  bookingNumber: string;
  customerId: number;
  customerName: string;
  invoiceDate: unknown;
  dueDate: unknown | null;
  subtotalAmount: string;
  taxAmount: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  status: string;
  notes: string | null;
  issuedAt: unknown | null;
  createdByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type CustomerPaymentRow = {
  id: number;
  paymentNumber: string;
  customerInvoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  amount: string;
  paymentDate: unknown;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  receivedByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type CustomerInvoice = ReturnType<typeof toCustomerInvoice>;
export type CustomerPayment = ReturnType<typeof toCustomerPayment>;
export type CustomerInvoiceResponse = { data: CustomerInvoice; message: string };
export type CustomerInvoicesListResponse = { data: CustomerInvoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type CustomerPaymentResponse = { data: CustomerPayment; message: string };
export type CustomerPaymentsListResponse = { data: CustomerPayment[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export function toCustomerInvoice(row: CustomerInvoiceRow) {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    booking: { id: row.bookingId, bookingNumber: row.bookingNumber },
    customer: { id: row.customerId, name: row.customerName },
    invoiceDate: toDateOnly(row.invoiceDate)!,
    dueDate: toDateOnly(row.dueDate),
    subtotalAmount: row.subtotalAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    balanceAmount: row.balanceAmount,
    status: row.status,
    notes: row.notes,
    issuedAt: row.issuedAt === null ? null : toIso(row.issuedAt),
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toCustomerPayment(row: CustomerPaymentRow) {
  return {
    id: row.id,
    paymentNumber: row.paymentNumber,
    invoice: { id: row.customerInvoiceId, invoiceNumber: row.invoiceNumber },
    customer: { id: row.customerId, name: row.customerName },
    amount: row.amount,
    paymentDate: toDateOnly(row.paymentDate)!,
    paymentMethod: row.paymentMethod,
    referenceNumber: row.referenceNumber,
    notes: row.notes,
    receivedByUserId: row.receivedByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toCustomerInvoiceResponse = (row: CustomerInvoiceRow): CustomerInvoiceResponse => ({ data: toCustomerInvoice(row), message: 'Success' });
export const toCustomerPaymentResponse = (row: CustomerPaymentRow): CustomerPaymentResponse => ({ data: toCustomerPayment(row), message: 'Success' });

export function toCustomerInvoicesListResponse(rows: CustomerInvoiceRow[], page: number, limit: number, total: number): CustomerInvoicesListResponse {
  return { data: rows.map(toCustomerInvoice), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export function toCustomerPaymentsListResponse(rows: CustomerPaymentRow[], page: number, limit: number, total: number): CustomerPaymentsListResponse {
  return { data: rows.map(toCustomerPayment), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
