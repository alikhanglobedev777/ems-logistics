import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useAgentCommissionAction, useCreateAgentCommission, useGetAgentCommissionById, useGetAgentCommissions, type AgentCommission } from '../api/agent-commissions.api';

export function AgentCommissionsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetAgentCommissions();
  const detail = useGetAgentCommissionById(Number(id ?? 0), Boolean(id));
  const create = useCreateAgentCommission();
  const approve = useAgentCommissionAction('approve');
  const pay = useAgentCommissionAction('pay');
  const rows: AgentCommission[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item ? { bookingId: String(item.booking.id), payableAfter: item.payableAfter, notes: item.notes ?? '', createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '' } : undefined;
  async function submit(values: FormValues) {
    await create.mutateAsync({ bookingId: Number(values.bookingId), payableAfter: values.payableAfter || 'customer_payment', notes: values.notes || null, createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null });
    await navigate({ to: '/agent-commissions' as any });
  }
  return <MasterDataPage
    title="Agent Commissions"
    resource="agent-commissions"
    mode={mode === 'edit' ? 'detail' : mode}
    rows={rows}
    detail={item}
    loading={list.isLoading || detail.isLoading}
    detailActions={item ? <div className="form-actions"><button onClick={() => approve.mutate({ id: item.id })} disabled={item.status !== 'pending'}>Approve</button><button onClick={() => pay.mutate({ id: item.id })} disabled={item.status !== 'approved'}>Mark paid</button></div> : null}
    columns={[
      { header: 'Commission #', render: (row) => row.commissionNumber },
      { header: 'Booking', render: (row) => row.booking.bookingNumber },
      { header: 'Agent', render: (row) => row.agent.name },
      { header: 'Amount', render: (row) => row.commissionAmount },
      { header: 'Status', render: (row) => row.status },
    ]}
    fields={[
      { name: 'bookingId', label: 'Booking ID', type: 'number' },
      { name: 'payableAfter', label: 'Payable after', options: ['delivery', 'customer_invoice', 'customer_payment'].map((value) => ({ label: value.replaceAll('_', ' '), value })) },
      { name: 'notes', label: 'Notes' },
      { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
    ]}
    schema={z.object({ bookingId: z.string().min(1), payableAfter: z.string().optional().default('customer_payment'), notes: z.string().optional().default(''), createdByUserId: z.string().optional().default('') })}
    initial={initial}
    onSubmit={submit}
  />;
}
