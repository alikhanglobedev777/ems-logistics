import { FilterBar, StatusBadge, getStatusTone } from '@ems/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { BookingStatus } from '@ems/shared';
import { useState } from 'react';
import { z } from 'zod';
import { PricingSnapshotPanel } from '../../../components/ui/pricing-snapshot-panel';
import { useGetAgents } from '../../agents/api/agents.api';
import { useGetCustomers } from '../../customers/api/customers.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetRoutes } from '../../routes/api/routes.api';
import { useGetStations } from '../../stations/api/stations.api';
import { useGetVehicleTypes } from '../../vehicle-types/api/vehicle-types.api';
import {
  useCancelBooking,
  useConfirmBooking,
  useCreateBooking,
  useGetBookingById,
  useGetBookingPricingSnapshot,
  useGetBookings,
  useUpdateBooking,
  type Booking,
} from '../api/bookings.api';

export function BookingsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useGetBookings({ page: 1, limit: 50 });
  const detail = useGetBookingById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const snapshot = useGetBookingPricingSnapshot(Number(id ?? 0), { query: { enabled: Boolean(id) && mode === 'detail' } });
  const customers = useGetCustomers({ page: 1, limit: 200 });
  const agents = useGetAgents({ page: 1, limit: 200 });
  const stations = useGetStations({ page: 1, limit: 200 });
  const routes = useGetRoutes({ page: 1, limit: 200 });
  const vehicleTypes = useGetVehicleTypes({ page: 1, limit: 200 });
  const create = useCreateBooking();
  const update = useUpdateBooking();
  const confirmBooking = useConfirmBooking();
  const cancelBooking = useCancelBooking();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    customer: '',
    origin: '',
    destination: '',
    dateFrom: '',
    dateTo: '',
  });

  const rows: Booking[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const pricingSnapshot = snapshot.data?.status === 200 ? snapshot.data.data.data : undefined;
  const customerSelectOptions = (customers.data?.status === 200 ? customers.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const agentSelectOptions = (agents.data?.status === 200 ? agents.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const stationSelectOptions = (stations.data?.status === 200 ? stations.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const routeSelectOptions = (routes.data?.status === 200 ? routes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const vehicleTypeSelectOptions = (vehicleTypes.data?.status === 200 ? vehicleTypes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));

  const filteredRows = rows.filter((row) => {
    const matchesSearch = !filters.search || `${row.bookingNumber} ${row.customer.name} ${row.cargoDescription}`
      .toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesStatus = !filters.status || row.status === filters.status;
    const matchesCustomer = !filters.customer || row.customer.name === filters.customer;
    const matchesOrigin = !filters.origin || row.originStation.name === filters.origin;
    const matchesDestination = !filters.destination || row.destinationStation.name === filters.destination;
    const createdAt = row.createdAt ? new Date(row.createdAt) : null;
    const matchesDateFrom = !filters.dateFrom || (createdAt && createdAt >= new Date(filters.dateFrom));
    const matchesDateTo = !filters.dateTo || (createdAt && createdAt <= new Date(`${filters.dateTo}T23:59:59`));

    return Boolean(
      matchesSearch &&
      matchesStatus &&
      matchesCustomer &&
      matchesOrigin &&
      matchesDestination &&
      matchesDateFrom &&
      matchesDateTo,
    );
  });

  const initial = item
    ? {
        customerId: String(item.customer.id),
        agentId: item.agent ? String(item.agent.id) : '',
        originStationId: String(item.originStation.id),
        destinationStationId: String(item.destinationStation.id),
        routeId: item.route ? String(item.route.id) : '',
        requiredVehicleTypeId: String(item.requiredVehicleType.id),
        cargoDescription: item.cargoDescription,
        cargoWeightTons: item.cargoWeightTons ?? '',
        quantity: item.quantity ?? '',
        pickupDate: item.pickupDate ?? '',
        deliveryDueDate: item.deliveryDueDate ?? '',
        finalFreightRate: item.finalFreightRate,
        status: item.status,
      }
    : undefined;

  async function submit(values: FormValues) {
    if (mode === 'edit') {
      await update.mutateAsync({
        bookingId: Number(id),
        data: {
          cargoDescription: values.cargoDescription,
          cargoWeightTons: values.cargoWeightTons ? Number(values.cargoWeightTons) : null,
          quantity: values.quantity ? Number(values.quantity) : null,
          pickupDate: values.pickupDate || null,
          deliveryDueDate: values.deliveryDueDate || null,
          status: values.status as Booking['status'],
        },
      });
    } else {
      await create.mutateAsync({
        data: {
          customerId: Number(values.customerId),
          agentId: values.agentId ? Number(values.agentId) : null,
          originStationId: Number(values.originStationId),
          destinationStationId: Number(values.destinationStationId),
          routeId: values.routeId ? Number(values.routeId) : null,
          requiredVehicleTypeId: Number(values.requiredVehicleTypeId),
          cargoDescription: values.cargoDescription,
          cargoWeightTons: values.cargoWeightTons ? Number(values.cargoWeightTons) : null,
          quantity: values.quantity ? Number(values.quantity) : null,
          pickupDate: values.pickupDate || null,
          deliveryDueDate: values.deliveryDueDate || null,
          finalFreightRate: values.finalFreightRate ? Number(values.finalFreightRate) : null,
          status: values.status as Booking['status'],
          items: [],
        },
      });
    }

    await navigate({ to: '/bookings' });
  }

  async function handleConfirm() {
    if (!item) return;

    await confirmBooking.mutateAsync({ bookingId: item.id });
    await invalidateBookingQueries();
  }

  async function handleCancel() {
    if (!item) return;

    const reason = window.prompt('Enter cancellation reason');
    if (!reason) return;

    await cancelBooking.mutateAsync({ bookingId: item.id, data: { reason } });
    await invalidateBookingQueries();
  }

  async function invalidateBookingQueries() {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const firstSegment = query.queryKey[0];
        return typeof firstSegment === 'string' && (firstSegment === '/bookings' || firstSegment.startsWith('/bookings/'));
      },
    });
  }

  const customerOptions = [...new Set(rows.map((row) => row.customer.name))].sort();
  const originOptions = [...new Set(rows.map((row) => row.originStation.name))].sort();
  const destinationOptions = [...new Set(rows.map((row) => row.destinationStation.name))].sort();

  return (
    <MasterDataPage
      title="Bookings / Bilty"
      resource="bookings"
      mode={mode}
      rows={filteredRows}
      detail={item}
      loading={
        list.isLoading ||
        detail.isLoading ||
        customers.isLoading ||
        agents.isLoading ||
        stations.isLoading ||
        routes.isLoading ||
        vehicleTypes.isLoading
      }
      description="Manage bilty creation, customer freight, routing, and pricing readiness."
      createLabel="Create booking"
      listToolbar={
        <FilterBar
          actions={
            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setFilters({
                  search: '',
                  status: '',
                  customer: '',
                  origin: '',
                  destination: '',
                  dateFrom: '',
                  dateTo: '',
                })
              }
            >
              Reset filters
            </button>
          }
        >
          <label className="filter-control">
            <span>Search</span>
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          </label>
          <label className="filter-control">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {Object.values(BookingStatus).map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Customer</span>
            <select value={filters.customer} onChange={(event) => setFilters((current) => ({ ...current, customer: event.target.value }))}>
              <option value="">All customers</option>
              {customerOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Origin station</span>
            <select value={filters.origin} onChange={(event) => setFilters((current) => ({ ...current, origin: event.target.value }))}>
              <option value="">All origins</option>
              {originOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Destination station</span>
            <select value={filters.destination} onChange={(event) => setFilters((current) => ({ ...current, destination: event.target.value }))}>
              <option value="">All destinations</option>
              {destinationOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span>Date from</span>
            <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          </label>
          <label className="filter-control">
            <span>Date to</span>
            <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          </label>
        </FilterBar>
      }
      detailActions={
        item ? (
          <>
            <button type="button" className="button" onClick={handleConfirm}>Confirm</button>
            <button type="button" className="button button-danger" onClick={handleCancel}>Cancel</button>
          </>
        ) : null
      }
      detailContent={<PricingSnapshotPanel snapshot={pricingSnapshot} />}
      columns={[
        { header: 'Bilty No', render: (row) => row.bookingNumber },
        { header: 'Customer', render: (row) => row.customer.name },
        { header: 'Route', render: (row) => row.route?.name ?? '--' },
        { header: 'Vehicle Type', render: (row) => row.requiredVehicleType.name },
        { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
        { header: 'Freight Amount', render: (row) => row.totalCustomerAmount },
        { header: 'Fuel Snapshot', render: (row) => (row.requiresRateApproval ? 'Approval required' : 'Calculated') },
        { header: 'Created Date', render: (row) => formatDate(row.createdAt) },
      ]}
      fields={[
        { name: 'customerId', label: 'Customer', options: customerSelectOptions },
        { name: 'agentId', label: 'Agent', options: agentSelectOptions },
        { name: 'originStationId', label: 'Origin station', options: stationSelectOptions },
        { name: 'destinationStationId', label: 'Destination station', options: stationSelectOptions },
        { name: 'routeId', label: 'Route', options: routeSelectOptions },
        { name: 'requiredVehicleTypeId', label: 'Required vehicle type', options: vehicleTypeSelectOptions },
        { name: 'cargoDescription', label: 'Cargo description' },
        { name: 'cargoWeightTons', label: 'Cargo weight tons', type: 'number' },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'pickupDate', label: 'Pickup date', type: 'date' },
        { name: 'deliveryDueDate', label: 'Delivery due date', type: 'date' },
        { name: 'finalFreightRate', label: 'Final customer rate', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          options: Object.values(BookingStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
      ]}
      schema={z.object({
        customerId: z.string().min(1),
        agentId: z.string().optional().default(''),
        originStationId: z.string().min(1),
        destinationStationId: z.string().min(1),
        routeId: z.string().optional().default(''),
        requiredVehicleTypeId: z.string().min(1),
        cargoDescription: z.string().min(1),
        cargoWeightTons: z.string().optional().default(''),
        quantity: z.string().optional().default(''),
        pickupDate: z.string().optional().default(''),
        deliveryDueDate: z.string().optional().default(''),
        finalFreightRate: z.string().optional().default(''),
        status: z.string().min(1),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
