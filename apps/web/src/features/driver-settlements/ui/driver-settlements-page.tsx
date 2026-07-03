import { useNavigate } from '@tanstack/react-router';
import { DriverSettlementStatus } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateDriverSettlement,
  useGetDriverSettlementById,
  useGetDriverSettlements,
  type DriverSettlement,
} from '../api/driver-settlements.api';

export function DriverSettlementsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetDriverSettlements({ page: 1, limit: 50 });
  const detail = useGetDriverSettlementById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateDriverSettlement();
  const rows: DriverSettlement[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item ? { masterTripId: String(item.masterTrip.id) } : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({ data: { masterTripId: Number(values.masterTripId) } });
    await navigate({ to: '/driver-settlements' });
  }

  return (
    <MasterDataPage
      title="Driver Settlements"
      resource="driver-settlements"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Settlement #', render: (row) => row.settlementNumber },
        { header: 'Trip', render: (row) => row.masterTrip.tripNumber },
        { header: 'Driver', render: (row) => row.driver.name },
        { header: 'Advance', render: (row) => row.totalAdvanceAmount },
        { header: 'Expense', render: (row) => row.totalApprovedExpenseAmount },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'masterTripId', label: 'Master trip ID', type: 'number' },
        {
          name: 'statusDisplay',
          label: 'Possible statuses',
          options: Object.values(DriverSettlementStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
      ]}
      schema={z.object({
        masterTripId: z.string().min(1),
        statusDisplay: z.string().optional().default('open'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
