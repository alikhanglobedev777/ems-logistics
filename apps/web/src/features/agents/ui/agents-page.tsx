import { useNavigate } from '@tanstack/react-router';
import { CommissionType } from '@ems/shared';
import { z } from 'zod';
import { useCreateAgent, useGetAgentById, useGetAgents, useUpdateAgent, type Agent } from '../api/agents.api';
import { MasterDataPage, type FormValues } from '../../master-data';

export function AgentsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetAgents({ page: 1, limit: 50 });
  const detail = useGetAgentById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateAgent();
  const update = useUpdateAgent();
  const rows: Agent[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        name: item.name,
        phone: item.phone,
        email: item.email ?? '',
        stationId: item.station ? String(item.station.id) : '',
        commissionType: item.commissionType,
        commissionValue: item.commissionValue ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      stationId: values.stationId ? Number(values.stationId) : null,
      commissionType: values.commissionType as Agent['commissionType'],
      commissionValue: values.commissionValue ? Number(values.commissionValue) : null,
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ agentId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/agents' });
  }

  return (
    <MasterDataPage
      title="Agents"
      resource="agents"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Name', render: (row) => row.name },
        { header: 'Phone', render: (row) => row.phone },
        { header: 'Station', render: (row) => row.station?.name ?? 'All stations' },
        {
          header: 'Commission',
          render: (row) => `${row.commissionType}${row.commissionValue ? ` · ${row.commissionValue}` : ''}`,
        },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'stationId', label: 'Station ID', type: 'number' },
        { name: 'commissionType', label: 'Commission type', options: Object.values(CommissionType).map((value) => ({ label: value, value })) },
        { name: 'commissionValue', label: 'Commission value', type: 'number' },
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
        phone: z.string().min(1),
        email: z.string(),
        stationId: z.string(),
        commissionType: z.string().min(1),
        commissionValue: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
