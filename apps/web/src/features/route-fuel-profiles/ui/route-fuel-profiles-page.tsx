import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateRouteFuelProfile,
  useGetRouteFuelProfileById,
  useGetRouteFuelProfiles,
  useUpdateRouteFuelProfile,
  type RouteFuelProfile,
} from '../api/route-fuel-profiles.api';

export function RouteFuelProfilesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetRouteFuelProfiles({ page: 1, limit: 50 });
  const detail = useGetRouteFuelProfileById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateRouteFuelProfile();
  const update = useUpdateRouteFuelProfile();
  const rows: RouteFuelProfile[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        routeId: String(item.route.id),
        vehicleTypeId: String(item.vehicleType.id),
        expectedLiters: item.expectedLiters,
        reserveLiters: item.reserveLiters,
        notes: item.notes ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      routeId: Number(values.routeId),
      vehicleTypeId: Number(values.vehicleTypeId),
      expectedLiters: Number(values.expectedLiters),
      reserveLiters: values.reserveLiters ? Number(values.reserveLiters) : 0,
      notes: values.notes || null,
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ routeFuelProfileId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/route-fuel-profiles' });
  }

  return (
    <MasterDataPage
      title="Route Fuel Profiles"
      resource="route-fuel-profiles"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Route', render: (row) => row.route.name },
        { header: 'Vehicle type', render: (row) => row.vehicleType.name },
        { header: 'Expected liters', render: (row) => row.expectedLiters },
        { header: 'Reserve liters', render: (row) => row.reserveLiters },
      ]}
      fields={[
        { name: 'routeId', label: 'Route ID', type: 'number' },
        { name: 'vehicleTypeId', label: 'Vehicle type ID', type: 'number' },
        { name: 'expectedLiters', label: 'Expected liters', type: 'number' },
        { name: 'reserveLiters', label: 'Reserve liters', type: 'number' },
        { name: 'notes', label: 'Notes' },
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
        routeId: z.string().min(1),
        vehicleTypeId: z.string().min(1),
        expectedLiters: z.string().min(1),
        reserveLiters: z.string(),
        notes: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
