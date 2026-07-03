import { useNavigate } from '@tanstack/react-router';
import { RoadCondition } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useCreateRoute, useGetRouteById, useGetRoutes, useUpdateRoute, type Route } from '../api/routes.api';

export function RoutesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetRoutes({ page: 1, limit: 50 });
  const detail = useGetRouteById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateRoute();
  const update = useUpdateRoute();
  const rows: Route[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        name: item.name,
        originStationId: String(item.originStation.id),
        destinationStationId: String(item.destinationStation.id),
        distanceKm: item.distanceKm ?? '',
        estimatedDurationHours: item.estimatedDurationHours ?? '',
        roadCondition: item.roadCondition,
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      originStationId: Number(values.originStationId),
      destinationStationId: Number(values.destinationStationId),
      distanceKm: values.distanceKm ? Number(values.distanceKm) : null,
      estimatedDurationHours: values.estimatedDurationHours ? Number(values.estimatedDurationHours) : null,
      roadCondition: values.roadCondition as Route['roadCondition'],
      isActive: values.isActive !== 'false',
    };

    if (mode === 'edit') await update.mutateAsync({ routeId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/routes' });
  }

  return (
    <MasterDataPage
      title="Routes"
      resource="routes"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Route', render: (row) => row.name },
        { header: 'Origin', render: (row) => row.originStation.name },
        { header: 'Destination', render: (row) => row.destinationStation.name },
        { header: 'Condition', render: (row) => row.roadCondition },
      ]}
      fields={[
        { name: 'name', label: 'Route name' },
        { name: 'originStationId', label: 'Origin station ID', type: 'number' },
        { name: 'destinationStationId', label: 'Destination station ID', type: 'number' },
        { name: 'distanceKm', label: 'Distance KM', type: 'number' },
        { name: 'estimatedDurationHours', label: 'Estimated duration hours', type: 'number' },
        {
          name: 'roadCondition',
          label: 'Road condition',
          options: Object.values(RoadCondition).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
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
        originStationId: z.string().min(1),
        destinationStationId: z.string().min(1),
        distanceKm: z.string(),
        estimatedDurationHours: z.string(),
        roadCondition: z.string().min(1),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
