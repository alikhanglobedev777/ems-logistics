import { FilterBar, StatusBadge, getStatusTone } from '@ems/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FuelSlipStatus, FuelType } from '@ems/shared';
import { useState } from 'react';
import { z } from 'zod';
import { useGetDrivers } from '../../drivers/api/drivers.api';
import { useGetFuelVendors } from '../../fuel-vendors/api/fuel-vendors.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetMasterTrips } from '../../trips/api/trips.api';
import { useGetVehicles } from '../../vehicles/api/vehicles.api';
import {
  useCreateFuelSlip,
  useGetFuelSlipById,
  useGetFuelSlips,
  useRejectFuelSlip,
  useVerifyFuelSlip,
  type CreateFuelSlipRequest,
  type FuelSlip,
} from '../api/fuel-slips.api';

export function FuelSlipsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useGetFuelSlips({ page: 1, limit: 50 });
  const fuelVendors = useGetFuelVendors({ page: 1, limit: 200 });
  const masterTrips = useGetMasterTrips({ page: 1, limit: 200 });
  const vehicles = useGetVehicles({ page: 1, limit: 200 });
  const drivers = useGetDrivers({ page: 1, limit: 200 });
  const detail = useGetFuelSlipById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateFuelSlip();
  const verify = useVerifyFuelSlip();
  const reject = useRejectFuelSlip();
  const [statusFilter, setStatusFilter] = useState('');

  const rows: FuelSlip[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const filteredRows = rows.filter((row) => !statusFilter || row.status === statusFilter);
  const fuelVendorOptions = (fuelVendors.data?.status === 200 ? fuelVendors.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const masterTripOptions = (masterTrips.data?.status === 200 ? masterTrips.data.data.data : []).map((entry) => ({
    label: entry.tripNumber,
    value: String(entry.id),
  }));
  const vehicleOptions = (vehicles.data?.status === 200 ? vehicles.data.data.data : []).map((entry) => ({
    label: entry.registrationNumber || entry.vehicleNumber,
    value: String(entry.id),
  }));
  const driverOptions = (drivers.data?.status === 200 ? drivers.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));

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

  async function handleVerify() {
    if (!item) return;

    await verify.mutateAsync({ fuelSlipId: item.id });
    await invalidateFuelSlipQueries();
  }

  async function handleReject() {
    if (!item) return;

    const reason = window.prompt('Enter rejection reason');
    if (!reason) return;

    await reject.mutateAsync({ fuelSlipId: item.id, data: { reason } });
    await invalidateFuelSlipQueries();
  }

  async function invalidateFuelSlipQueries() {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const firstSegment = query.queryKey[0];
        return typeof firstSegment === 'string' && (firstSegment === '/fuel-slips' || firstSegment.startsWith('/fuel-slips/'));
      },
    });
  }

  return (
    <MasterDataPage
      title="Fuel Slips"
      resource="fuel-slips"
      mode={mode}
      rows={filteredRows}
      detail={item}
      loading={
        list.isLoading ||
        detail.isLoading ||
        fuelVendors.isLoading ||
        masterTrips.isLoading ||
        vehicles.isLoading ||
        drivers.isLoading
      }
      description="Fuel verification queue, vendor control, and proof review."
      createLabel="Log fuel slip"
      listToolbar={
        <FilterBar>
          <label className="filter-control">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {Object.values(FuelSlipStatus).map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        </FilterBar>
      }
      detailActions={
        item ? (
          <>
            <button type="button" className="button" onClick={handleVerify}>Verify</button>
            <button type="button" className="button button-danger" onClick={handleReject}>Reject</button>
          </>
        ) : null
      }
      columns={[
        { header: 'Slip #', render: (row) => row.slipNumber },
        { header: 'Fuel vendor', render: (row) => row.vendor.name },
        { header: 'Fuel card / Vehicle', render: (row) => row.vehicle.registrationNumber },
        { header: 'Liters', render: (row) => row.liters },
        { header: 'Rate', render: (row) => row.pricePerLiter },
        { header: 'Amount', render: (row) => row.totalAmount },
        { header: 'Trip reference', render: (row) => row.masterTrip?.tripNumber ?? row.tripLeg?.id ?? '--' },
        { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
      ]}
      fields={[
        { name: 'fuelVendorId', label: 'Fuel vendor', options: fuelVendorOptions },
        { name: 'masterTripId', label: 'Master trip', options: masterTripOptions },
        { name: 'tripLegId', label: 'Trip leg ID', type: 'number' },
        { name: 'vehicleId', label: 'Vehicle', options: vehicleOptions },
        { name: 'driverId', label: 'Driver', options: driverOptions },
        { name: 'fuelType', label: 'Fuel type', options: Object.values(FuelType).map((value) => ({ label: value, value })) },
        { name: 'liters', label: 'Liters', type: 'number' },
        { name: 'pricePerLiter', label: 'Price per liter', type: 'number' },
        { name: 'slipDate', label: 'Slip date', type: 'date' },
        { name: 'odometerReading', label: 'Odometer reading', type: 'number' },
        { name: 'stationName', label: 'Fuel station name' },
        { name: 'notes', label: 'Notes' },
        { name: 'statusDisplay', label: 'Verification status', options: Object.values(FuelSlipStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })) },
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
