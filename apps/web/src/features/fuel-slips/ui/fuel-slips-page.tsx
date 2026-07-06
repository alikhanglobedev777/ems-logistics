import { useNavigate } from '@tanstack/react-router';
import { FuelSlipStatus, FuelType } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateFuelSlip,
  useGetFuelSlipById,
  useGetFuelSlips,
  type CreateFuelSlipRequest,
  type FuelSlip,
} from '../api/fuel-slips.api';

export function FuelSlipsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetFuelSlips({ page: 1, limit: 50 });
  const detail = useGetFuelSlipById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateFuelSlip();
  const rows: FuelSlip[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        fuelVendorId: String(item.vendor.id),
        masterTripId: item.masterTrip ? String(item.masterTrip.id) : '',
        tripLegId: item.tripLeg ? String(item.tripLeg.id) : '',
        vehicleId: String(item.vehicle.id),
        driverId: String(item.driver.id),
        fuelType: item.fuelType,
        liters: item.liters,
        pricePerLiter: item.pricePerLiter,
        slipDate: item.slipDate,
        odometerReading: item.odometerReading ?? '',
        stationName: item.stationName ?? '',
        notes: item.notes ?? '',
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      data: {
        fuelVendorId: Number(values.fuelVendorId),
        masterTripId: values.masterTripId ? Number(values.masterTripId) : null,
        tripLegId: values.tripLegId ? Number(values.tripLegId) : null,
        vehicleId: values.vehicleId ? Number(values.vehicleId) : null,
        driverId: values.driverId ? Number(values.driverId) : null,
        fuelType: (values.fuelType || FuelType.DIESEL) as CreateFuelSlipRequest['fuelType'],
        liters: Number(values.liters),
        pricePerLiter: Number(values.pricePerLiter),
        slipDate: values.slipDate || null,
        odometerReading: values.odometerReading ? Number(values.odometerReading) : null,
        stationName: values.stationName || null,
        notes: values.notes || null,
      },
    });
    await navigate({ to: '/fuel-slips' });
  }

  return (
    <MasterDataPage
      title="Fuel Slips"
      resource="fuel-slips"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Slip #', render: (row) => row.slipNumber },
        { header: 'Vendor', render: (row) => row.vendor.name },
        { header: 'Vehicle', render: (row) => row.vehicle.registrationNumber },
        { header: 'Liters', render: (row) => row.liters },
        { header: 'Total', render: (row) => row.totalAmount },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'fuelVendorId', label: 'Fuel vendor ID', type: 'number' },
        { name: 'masterTripId', label: 'Master trip ID', type: 'number' },
        { name: 'tripLegId', label: 'Trip leg ID', type: 'number' },
        { name: 'vehicleId', label: 'Vehicle ID', type: 'number' },
        { name: 'driverId', label: 'Driver ID', type: 'number' },
        { name: 'fuelType', label: 'Fuel type', options: Object.values(FuelType).map((value) => ({ label: value, value })) },
        { name: 'liters', label: 'Liters', type: 'number' },
        { name: 'pricePerLiter', label: 'Price per liter', type: 'number' },
        { name: 'slipDate', label: 'Slip date' },
        { name: 'odometerReading', label: 'Odometer reading', type: 'number' },
        { name: 'stationName', label: 'Fuel station name' },
        { name: 'notes', label: 'Notes' },
        { name: 'statusDisplay', label: 'Possible statuses', options: Object.values(FuelSlipStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })) },
      ]}
      schema={z.object({
        fuelVendorId: z.string().min(1),
        masterTripId: z.string().optional().default(''),
        tripLegId: z.string().optional().default(''),
        vehicleId: z.string().optional().default(''),
        driverId: z.string().optional().default(''),
        fuelType: z.string().optional().default(FuelType.DIESEL),
        liters: z.string().min(1),
        pricePerLiter: z.string().min(1),
        slipDate: z.string().optional().default(''),
        odometerReading: z.string().optional().default(''),
        stationName: z.string().optional().default(''),
        notes: z.string().optional().default(''),
        statusDisplay: z.string().optional().default(FuelSlipStatus.PENDING),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
