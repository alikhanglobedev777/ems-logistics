import { useNavigate } from '@tanstack/react-router';
import { TripStatus } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateMasterTrip,
  useGetMasterTripById,
  useGetMasterTrips,
  type MasterTrip,
} from '../api/trips.api';

export function TripsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetMasterTrips({ page: 1, limit: 50 });
  const detail = useGetMasterTripById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateMasterTrip();
  const rows: MasterTrip[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        vehicleId: String(item.vehicle.id),
        driverId: String(item.driver.id),
        startStationId: String(item.startStation.id),
        plannedStartAt: item.plannedStartAt ?? '',
        createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '',
        status: item.status,
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      data: {
        vehicleId: Number(values.vehicleId),
        driverId: Number(values.driverId),
        startStationId: Number(values.startStationId),
        plannedStartAt: values.plannedStartAt || null,
        createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null,
      },
    });
    await navigate({ to: '/trips' });
  }

  return (
    <MasterDataPage
      title="Master Trips"
      resource="trips"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Trip #', render: (row) => row.tripNumber },
        { header: 'Vehicle', render: (row) => row.vehicle.vehicleNumber },
        { header: 'Driver', render: (row) => row.driver.name },
        { header: 'Current station', render: (row) => row.currentStation.name },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'vehicleId', label: 'Vehicle ID', type: 'number' },
        { name: 'driverId', label: 'Driver ID', type: 'number' },
        { name: 'startStationId', label: 'Start station ID', type: 'number' },
        { name: 'plannedStartAt', label: 'Planned start at', type: 'datetime-local' },
        { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          options: Object.values(TripStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
      ]}
      schema={z.object({
        vehicleId: z.string().min(1),
        driverId: z.string().min(1),
        startStationId: z.string().min(1),
        plannedStartAt: z.string().optional().default(''),
        createdByUserId: z.string().optional().default(''),
        status: z.string().optional().default('planned'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
