import { useNavigate } from '@tanstack/react-router';
import { BookingStatus } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateBooking,
  useGetBookingById,
  useGetBookings,
  useUpdateBooking,
  type Booking,
} from '../api/bookings.api';

export function BookingsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetBookings({ page: 1, limit: 50 });
  const detail = useGetBookingById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateBooking();
  const update = useUpdateBooking();
  const rows: Booking[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

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

  return (
    <MasterDataPage
      title="Bookings / Bilty"
      resource="bookings"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Bilty #', render: (row) => row.bookingNumber },
        { header: 'Customer', render: (row) => row.customer.name },
        { header: 'Route', render: (row) => row.route?.name ?? '—' },
        { header: 'Status', render: (row) => row.status },
        { header: 'Total', render: (row) => row.totalCustomerAmount },
      ]}
      fields={[
        { name: 'customerId', label: 'Customer ID', type: 'number' },
        { name: 'agentId', label: 'Agent ID', type: 'number' },
        { name: 'originStationId', label: 'Origin station ID', type: 'number' },
        { name: 'destinationStationId', label: 'Destination station ID', type: 'number' },
        { name: 'routeId', label: 'Route ID', type: 'number' },
        { name: 'requiredVehicleTypeId', label: 'Required vehicle type ID', type: 'number' },
        { name: 'cargoDescription', label: 'Cargo description' },
        { name: 'cargoWeightTons', label: 'Cargo weight tons', type: 'number' },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'pickupDate', label: 'Pickup date', type: 'date' },
        { name: 'deliveryDueDate', label: 'Delivery due date', type: 'date' },
        { name: 'finalFreightRate', label: 'Negotiated final freight rate', type: 'number' },
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
