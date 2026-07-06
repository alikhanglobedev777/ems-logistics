import { useNavigate } from '@tanstack/react-router';
import { PaymentMethod } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetFuelVendorPaymentById, useGetFuelVendorPayments, usePayFuelVendorInvoice, type FuelVendorPayment } from '../api/fuel-vendor-payments.api';

export function FuelVendorPaymentsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetFuelVendorPayments();
  const detail = useGetFuelVendorPaymentById(Number(id ?? 0), Boolean(id));
  const pay = usePayFuelVendorInvoice();
  const rows: FuelVendorPayment[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item ? { fuelVendorInvoiceId: String(item.invoice.id), amount: item.amount, paymentDate: item.paymentDate, paymentMethod: item.paymentMethod, referenceNumber: item.referenceNumber ?? '', notes: item.notes ?? '', paidByUserId: item.paidByUserId ? String(item.paidByUserId) : '' } : undefined;
  async function submit(values: FormValues) {
    await pay.mutateAsync({ invoiceId: Number(values.fuelVendorInvoiceId), data: { amount: Number(values.amount), paymentDate: values.paymentDate || null, paymentMethod: values.paymentMethod || PaymentMethod.BANK_TRANSFER, referenceNumber: values.referenceNumber || null, notes: values.notes || null, paidByUserId: values.paidByUserId ? Number(values.paidByUserId) : null } });
    await navigate({ to: '/fuel-vendor-payments' as any });
  }
  return <MasterDataPage
    title="Fuel Vendor Payments"
    resource="fuel-vendor-payments"
    mode={mode === 'edit' ? 'detail' : mode}
    rows={rows}
    detail={item}
    loading={list.isLoading || detail.isLoading}
    columns={[
      { header: 'Payment #', render: (row) => row.paymentNumber },
      { header: 'Invoice', render: (row) => row.invoice.invoiceNumber },
      { header: 'Vendor', render: (row) => row.vendor.name },
      { header: 'Amount', render: (row) => row.amount },
      { header: 'Date', render: (row) => row.paymentDate },
    ]}
    fields={[
      { name: 'fuelVendorInvoiceId', label: 'Fuel vendor invoice ID', type: 'number' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'paymentDate', label: 'Payment date', type: 'date' },
      { name: 'paymentMethod', label: 'Payment method', options: Object.values(PaymentMethod).map((value) => ({ label: value.replaceAll('_', ' '), value })) },
      { name: 'referenceNumber', label: 'Reference number' },
      { name: 'notes', label: 'Notes' },
      { name: 'paidByUserId', label: 'Paid by user ID', type: 'number' },
    ]}
    schema={z.object({ fuelVendorInvoiceId: z.string().min(1), amount: z.string().min(1), paymentDate: z.string().optional().default(''), paymentMethod: z.string().optional().default('bank_transfer'), referenceNumber: z.string().optional().default(''), notes: z.string().optional().default(''), paidByUserId: z.string().optional().default('') })}
    initial={initial}
    onSubmit={submit}
  />;
}
