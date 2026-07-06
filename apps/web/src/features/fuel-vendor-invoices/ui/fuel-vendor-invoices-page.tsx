import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useCreateFuelVendorInvoice, useGetFuelVendorInvoiceById, useGetFuelVendorInvoices, type FuelVendorInvoice } from '../api/fuel-vendor-invoices.api';

export function FuelVendorInvoicesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetFuelVendorInvoices();
  const detail = useGetFuelVendorInvoiceById(Number(id ?? 0), Boolean(id));
  const create = useCreateFuelVendorInvoice();
  const rows: FuelVendorInvoice[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item ? { fuelVendorId: String(item.vendor.id), slipIds: '', vendorInvoiceNumber: item.vendorInvoiceNumber ?? '', invoiceDate: item.invoiceDate, dueDate: item.dueDate ?? '', notes: item.notes ?? '', createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '' } : undefined;
  async function submit(values: FormValues) {
    await create.mutateAsync({ fuelVendorId: Number(values.fuelVendorId), slipIds: values.slipIds.split(',').map((value) => Number(value.trim())).filter(Boolean), vendorInvoiceNumber: values.vendorInvoiceNumber || null, invoiceDate: values.invoiceDate || null, dueDate: values.dueDate || null, notes: values.notes || null, createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null });
    await navigate({ to: '/fuel-vendor-invoices' as any });
  }
  return <MasterDataPage
    title="Fuel Vendor Invoices"
    resource="fuel-vendor-invoices"
    mode={mode === 'edit' ? 'detail' : mode}
    rows={rows}
    detail={item}
    loading={list.isLoading || detail.isLoading}
    columns={[
      { header: 'Invoice #', render: (row) => row.invoiceNumber },
      { header: 'Vendor', render: (row) => row.vendor.name },
      { header: 'Status', render: (row) => row.status },
      { header: 'Total', render: (row) => row.totalAmount },
      { header: 'Balance', render: (row) => row.balanceAmount },
    ]}
    fields={[
      { name: 'fuelVendorId', label: 'Fuel vendor ID', type: 'number' },
      { name: 'slipIds', label: 'Verified fuel slip IDs comma separated' },
      { name: 'vendorInvoiceNumber', label: 'Vendor invoice number' },
      { name: 'invoiceDate', label: 'Invoice date', type: 'date' },
      { name: 'dueDate', label: 'Due date', type: 'date' },
      { name: 'notes', label: 'Notes' },
      { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
    ]}
    schema={z.object({ fuelVendorId: z.string().min(1), slipIds: z.string().min(1), vendorInvoiceNumber: z.string().optional().default(''), invoiceDate: z.string().optional().default(''), dueDate: z.string().optional().default(''), notes: z.string().optional().default(''), createdByUserId: z.string().optional().default('') })}
    initial={initial}
    onSubmit={submit}
  />;
}
