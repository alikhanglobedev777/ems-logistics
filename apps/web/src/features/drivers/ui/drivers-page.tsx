import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useCreateDriver, useGetDriverById, useGetDrivers, useUpdateDriver, type Driver } from '../api/drivers.api';
import { MasterDataPage, type FormValues } from '../../master-data';

export function DriversPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetDrivers({ page: 1, limit: 50 });
  const detail = useGetDriverById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateDriver();
  const update = useUpdateDriver();
  const rows: Driver[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        name: item.name,
        phone: item.phone,
        cnic: item.cnic ?? '',
        licenseNumber: item.licenseNumber ?? '',
        licenseExpiry: item.licenseExpiry ?? '',
        address: item.address ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      phone: values.phone,
      cnic: values.cnic || null,
      licenseNumber: values.licenseNumber || null,
      licenseExpiry: values.licenseExpiry || null,
      address: values.address || null,
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ driverId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/drivers' });
  }

  return (
    <MasterDataPage
      title="Drivers"
      resource="drivers"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Name', render: (row) => row.name },
        { header: 'Phone', render: (row) => row.phone },
        { header: 'CNIC', render: (row) => row.cnic ?? '—' },
        { header: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'phone', label: 'Phone' },
        { name: 'cnic', label: 'CNIC' },
        { name: 'licenseNumber', label: 'License number' },
        { name: 'licenseExpiry', label: 'License expiry', type: 'date' },
        { name: 'address', label: 'Address' },
        {
          name: 'isActive',
          label: 'Status',
          options: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        },
      ]}
      schema={z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        cnic: z.string(),
        licenseNumber: z.string(),
        licenseExpiry: z.string(),
        address: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
