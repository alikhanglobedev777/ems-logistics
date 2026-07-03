import { useNavigate } from '@tanstack/react-router';
import { DriverAdvanceStatus } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateDriverAdvance,
  useGetDriverAdvanceById,
  useGetDriverAdvances,
  type CreateDriverAdvanceRequest,
  type DriverAdvance,
} from '../api/driver-advances.api';

export function DriverAdvancesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetDriverAdvances({ page: 1, limit: 50 });
  const detail = useGetDriverAdvanceById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateDriverAdvance();
  const rows: DriverAdvance[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        masterTripId: String(item.masterTrip.id),
        amount: item.amount,
        advanceType: item.advanceType,
        paymentMethod: item.paymentMethod,
        reason: item.reason ?? '',
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      data: {
        masterTripId: Number(values.masterTripId),
        amount: Number(values.amount),
        advanceType: (values.advanceType || 'cash_trip_expense') as CreateDriverAdvanceRequest['advanceType'],
        paymentMethod: (values.paymentMethod || 'cash') as CreateDriverAdvanceRequest['paymentMethod'],
        reason: values.reason || null,
      },
    });
    await navigate({ to: '/driver-advances' });
  }

  return (
    <MasterDataPage
      title="Driver Advances"
      resource="driver-advances"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Advance #', render: (row) => row.advanceNumber },
        { header: 'Trip', render: (row) => row.masterTrip.tripNumber },
        { header: 'Driver', render: (row) => row.driver.name },
        { header: 'Amount', render: (row) => row.amount },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'masterTripId', label: 'Master trip ID', type: 'number' },
        { name: 'amount', label: 'Amount', type: 'number' },
        {
          name: 'advanceType',
          label: 'Advance type',
          options: ['cash_trip_expense', 'toll_tax', 'loading_unloading', 'repair_emergency', 'other'].map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
        {
          name: 'paymentMethod',
          label: 'Payment method',
          options: ['cash', 'bank_transfer', 'mobile_wallet', 'cheque'].map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
        { name: 'reason', label: 'Reason' },
        {
          name: 'statusDisplay',
          label: 'Possible statuses',
          options: Object.values(DriverAdvanceStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
      ]}
      schema={z.object({
        masterTripId: z.string().min(1),
        amount: z.string().min(1),
        advanceType: z.string().optional().default('cash_trip_expense'),
        paymentMethod: z.string().optional().default('cash'),
        reason: z.string().optional().default(''),
        statusDisplay: z.string().optional().default('draft'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}

