import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateFuelVendor,
  useGetFuelVendorById,
  useGetFuelVendors,
  useUpdateFuelVendor,
  type FuelVendor,
} from '../api/fuel-vendors.api';

export function FuelVendorsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetFuelVendors({ page: 1, limit: 50 });
  const detail = useGetFuelVendorById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateFuelVendor();
  const update = useUpdateFuelVendor();
  const rows: FuelVendor[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        name: item.name,
        contactPerson: item.contactPerson ?? '',
        phone: item.phone ?? '',
        email: item.email ?? '',
        address: item.address ?? '',
        city: item.city ?? '',
        ntn: item.ntn ?? '',
        paymentTermsDays: String(item.paymentTermsDays),
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      contactPerson: values.contactPerson || null,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
      city: values.city || null,
      ntn: values.ntn || null,
      paymentTermsDays: Number(values.paymentTermsDays || 0),
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit' && id) {
      await update.mutateAsync({ fuelVendorId: Number(id), data });
    } else {
      await create.mutateAsync({ data });
    }
    await navigate({ to: '/fuel-vendors' });
  }

  return (
    <MasterDataPage
      title="Fuel Vendors"
      resource="fuel-vendors"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Name', render: (row) => row.name },
        { header: 'Phone', render: (row) => row.phone ?? '-' },
        { header: 'City', render: (row) => row.city ?? '-' },
        { header: 'Active', render: (row) => (row.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'name', label: 'Vendor name' },
        { name: 'contactPerson', label: 'Contact person' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email' },
        { name: 'address', label: 'Address' },
        { name: 'city', label: 'City' },
        { name: 'ntn', label: 'NTN' },
        { name: 'paymentTermsDays', label: 'Payment terms days', type: 'number' },
        { name: 'isActive', label: 'Active', options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      ]}
      schema={z.object({
        name: z.string().min(1),
        contactPerson: z.string().optional().default(''),
        phone: z.string().optional().default(''),
        email: z.string().optional().default(''),
        address: z.string().optional().default(''),
        city: z.string().optional().default(''),
        ntn: z.string().optional().default(''),
        paymentTermsDays: z.string().optional().default('0'),
        isActive: z.string().optional().default('true'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
