import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import {
  useCreateVehicleType,
  useGetVehicleTypeById,
  useGetVehicleTypes,
  useUpdateVehicleType,
  type VehicleType,
} from '../api/vehicle-types.api';
import { MasterDataPage, type FormValues } from '../../master-data';

export function VehicleTypesPage({
  mode,
  id,
}: {
  mode: 'list' | 'create' | 'edit' | 'detail';
  id?: string;
}) {
  const navigate = useNavigate();
  const list = useGetVehicleTypes({ page: 1, limit: 50 });
  const detail = useGetVehicleTypeById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateVehicleType();
  const update = useUpdateVehicleType();

  const rows: VehicleType[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        name: item.name,
        code: item.code,
        capacityTons: item.capacityTons ?? '',
        description: item.description ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      code: values.code,
      capacityTons: values.capacityTons ? Number(values.capacityTons) : null,
      description: values.description || null,
      isActive: values.isActive !== 'false',
    };

    if (mode === 'edit') await update.mutateAsync({ vehicleTypeId: Number(id), data });
    else await create.mutateAsync({ data });

    await navigate({ to: '/vehicle-types' });
  }

  return (
    <MasterDataPage
      title="Vehicle Types"
      resource="vehicle-types"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Code', render: (row) => row.code },
        { header: 'Name', render: (row) => row.name },
        { header: 'Capacity', render: (row) => row.capacityTons ?? '—' },
        { header: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'code', label: 'Code' },
        { name: 'capacityTons', label: 'Capacity tons', type: 'number' },
        { name: 'description', label: 'Description' },
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
        code: z.string().min(1),
        capacityTons: z.string(),
        description: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
