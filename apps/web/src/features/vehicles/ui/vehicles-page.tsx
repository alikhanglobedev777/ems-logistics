import { useNavigate } from '@tanstack/react-router';
import { VehicleStatus } from '@ems/shared';
import { z } from 'zod';
import { useCreateVehicle, useGetVehicleById, useGetVehicles, useUpdateVehicle, type Vehicle } from '../api/vehicles.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetStations } from '../../stations/api/stations.api';
import { useGetVehicleTypes } from '../../vehicle-types/api/vehicle-types.api';

export function VehiclesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetVehicles({ page: 1, limit: 50 });
  const vehicleTypes = useGetVehicleTypes({ page: 1, limit: 100 });
  const stations = useGetStations({ isActive: true });
  const detail = useGetVehicleById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const rows: Vehicle[] = list.data?.status === 200 ? list.data.data.data : [];
  const vehicleTypeRows = vehicleTypes.data?.status === 200 ? vehicleTypes.data.data.data : [];
  const stationRows = stations.data?.status === 200 ? stations.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        vehicleNumber: item.vehicleNumber,
        vehicleTypeId: String(item.vehicleType.id),
        currentStationId: String(item.currentStation.id),
        status: item.status,
        fuelCardNumber: item.fuelCardNumber ?? '',
        registrationExpiry: item.registrationExpiry ?? '',
        fitnessExpiry: item.fitnessExpiry ?? '',
        insuranceExpiry: item.insuranceExpiry ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      vehicleNumber: values.vehicleNumber,
      vehicleTypeId: Number(values.vehicleTypeId),
      currentStationId: Number(values.currentStationId),
      status: values.status as Vehicle['status'],
      fuelCardNumber: values.fuelCardNumber || null,
      registrationExpiry: values.registrationExpiry || null,
      fitnessExpiry: values.fitnessExpiry || null,
      insuranceExpiry: values.insuranceExpiry || null,
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ vehicleId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/vehicles' });
  }

  return (
    <MasterDataPage
      title="Vehicles"
      resource="vehicles"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || vehicleTypes.isLoading || stations.isLoading || detail.isLoading}
      columns={[
        { header: 'Vehicle', render: (row) => row.vehicleNumber },
        { header: 'Type', render: (row) => row.vehicleType.name },
        { header: 'Station', render: (row) => row.currentStation.name },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'vehicleNumber', label: 'Vehicle number' },
        {
          name: 'vehicleTypeId',
          label: 'Vehicle type',
          options: vehicleTypeRows.map((vehicleType) => ({
            label: `${vehicleType.code} - ${vehicleType.name}`,
            value: String(vehicleType.id),
          })),
        },
        {
          name: 'currentStationId',
          label: 'Current station',
          options: stationRows.map((station) => ({
            label: station.code ? `${station.code} - ${station.name}` : station.name,
            value: String(station.id),
          })),
        },
        {
          name: 'status',
          label: 'Status',
          options: Object.values(VehicleStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
        { name: 'fuelCardNumber', label: 'Fuel card number' },
        { name: 'registrationExpiry', label: 'Registration expiry', type: 'date' },
        { name: 'fitnessExpiry', label: 'Fitness expiry', type: 'date' },
        { name: 'insuranceExpiry', label: 'Insurance expiry', type: 'date' },
        {
          name: 'isActive',
          label: 'Active',
          options: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        },
      ]}
      schema={z.object({
        vehicleNumber: z.string().min(1),
        vehicleTypeId: z.string().min(1),
        currentStationId: z.string().min(1),
        status: z.string().min(1),
        fuelCardNumber: z.string(),
        registrationExpiry: z.string(),
        fitnessExpiry: z.string(),
        insuranceExpiry: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
