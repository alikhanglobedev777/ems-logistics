import { StatusBadge, getStatusTone } from '@ems/ui';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { InvoicePreview } from '../../../components/ui/invoice-preview';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateCustomerInvoice,
  useGetCustomerInvoiceById,
  useGetCustomerInvoices,
  type CustomerInvoice,
} from '../api/customer-invoices.api';

export function CustomerInvoicesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetCustomerInvoices();
  const detail = useGetCustomerInvoiceById(Number(id ?? 0), Boolean(id));
  const create = useCreateCustomerInvoice();
  const rows: CustomerInvoice[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        bookingId: String(item.booking.id),
        invoiceDate: item.invoiceDate,
        dueDate: item.dueDate ?? '',
        notes: item.notes ?? '',
        createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '',
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      bookingId: Number(values.bookingId),
      invoiceDate: values.invoiceDate || null,
      dueDate: values.dueDate || null,
      notes: values.notes || null,
      createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null,
    });

    await navigate({ to: '/customer-invoices' });
  }

  return (
    <MasterDataPage
      title="Customer Invoices"
      resource="customer-invoices"
      mode={mode === 'edit' ? 'detail' : mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      description="Customer billing, balance tracking, and invoice issue workflow."
      createLabel="Create invoice"
      detailContent={<InvoicePreview invoice={item} />}
      columns={[
        { header: 'Invoice #', render: (row) => row.invoiceNumber ?? '--' },
        { header: 'Booking', render: (row) => row.booking?.bookingNumber ?? '--' },
        { header: 'Customer', render: (row) => row.customer?.name ?? '--' },
        { header: 'Status', render: (row) => <StatusBadge label={row.status ?? 'unknown'} tone={getStatusTone(row.status ?? 'unknown')} /> },
        { header: 'Balance', render: (row) => row.balanceAmount ?? '--' },
      ]}
      fields={[
        { name: 'bookingId', label: 'POD uploaded booking ID', type: 'number' },
        { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
        { name: 'dueDate', label: 'Due date', type: 'date' },
        { name: 'notes', label: 'Notes' },
        { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
      ]}
      schema={z.object({
        bookingId: z.string().min(1),
        invoiceDate: z.string().optional().default(''),
        dueDate: z.string().optional().default(''),
        notes: z.string().optional().default(''),
        createdByUserId: z.string().optional().default(''),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
