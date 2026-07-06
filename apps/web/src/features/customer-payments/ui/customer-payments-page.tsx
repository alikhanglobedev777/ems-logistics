import { useNavigate } from '@tanstack/react-router';
import { PaymentMethod } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetCustomerPaymentById, useGetCustomerPayments, useReceiveCustomerPayment, type CustomerPayment } from '../api/customer-payments.api';

export function CustomerPaymentsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetCustomerPayments();
  const detail = useGetCustomerPaymentById(Number(id ?? 0), Boolean(id));
  const receive = useReceiveCustomerPayment();
  const rows: CustomerPayment[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item ? { customerInvoiceId: String(item.invoice.id), amount: item.amount, paymentDate: item.paymentDate, paymentMethod: item.paymentMethod, referenceNumber: item.referenceNumber ?? '', notes: item.notes ?? '', receivedByUserId: item.receivedByUserId ? String(item.receivedByUserId) : '' } : undefined;
  async function submit(values: FormValues) {
    await receive.mutateAsync({ invoiceId: Number(values.customerInvoiceId), data: { amount: Number(values.amount), paymentDate: values.paymentDate || null, paymentMethod: values.paymentMethod || PaymentMethod.CASH, referenceNumber: values.referenceNumber || null, notes: values.notes || null, receivedByUserId: values.receivedByUserId ? Number(values.receivedByUserId) : null } });
    await navigate({ to: '/customer-payments' as any });
  }
  return <MasterDataPage
    title="Customer Payments"
    resource="customer-payments"
    mode={mode === 'edit' ? 'detail' : mode}
    rows={rows}
    detail={item}
    loading={list.isLoading || detail.isLoading}
    columns={[
      { header: 'Payment #', render: (row) => row.paymentNumber },
      { header: 'Invoice', render: (row) => row.invoice.invoiceNumber },
      { header: 'Customer', render: (row) => row.customer.name },
      { header: 'Amount', render: (row) => row.amount },
      { header: 'Date', render: (row) => row.paymentDate },
    ]}
    fields={[
      { name: 'customerInvoiceId', label: 'Customer invoice ID', type: 'number' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'paymentDate', label: 'Payment date', type: 'date' },
      { name: 'paymentMethod', label: 'Payment method', options: Object.values(PaymentMethod).map((value) => ({ label: value.replaceAll('_', ' '), value })) },
      { name: 'referenceNumber', label: 'Reference number' },
      { name: 'notes', label: 'Notes' },
      { name: 'receivedByUserId', label: 'Received by user ID', type: 'number' },
    ]}
    schema={z.object({ customerInvoiceId: z.string().min(1), amount: z.string().min(1), paymentDate: z.string().optional().default(''), paymentMethod: z.string().optional().default('cash'), referenceNumber: z.string().optional().default(''), notes: z.string().optional().default(''), receivedByUserId: z.string().optional().default('') })}
    initial={initial}
    onSubmit={submit}
  />;
}
