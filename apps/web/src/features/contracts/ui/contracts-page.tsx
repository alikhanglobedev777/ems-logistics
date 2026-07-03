import { useNavigate } from '@tanstack/react-router';
import { ContractRateModel, ContractStatus } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateContract,
  useGetContractById,
  useGetContracts,
  useUpdateContract,
  type CustomerContract,
} from '../api/contracts.api';

export function ContractsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetContracts({ page: 1, limit: 50 });
  const detail = useGetContractById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateContract();
  const update = useUpdateContract();
  const rows: CustomerContract[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        customerId: String(item.customer.id),
        contractNumber: item.contractNumber,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        rateModel: item.rateModel,
        fuelAdjustmentEnabled: String(item.fuelAdjustmentEnabled),
        fuelBasePrice: item.fuelBasePrice ?? '',
        fuelAdjustmentPerLiter: item.fuelAdjustmentPerLiter ?? '',
        status: item.status,
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      customerId: Number(values.customerId),
      contractNumber: values.contractNumber,
      title: values.title,
      startDate: values.startDate,
      endDate: values.endDate,
      rateModel: values.rateModel as CustomerContract['rateModel'],
      fuelAdjustmentEnabled: values.fuelAdjustmentEnabled === 'true',
      fuelBasePrice: values.fuelBasePrice ? Number(values.fuelBasePrice) : null,
      fuelAdjustmentPerLiter: values.fuelAdjustmentPerLiter ? Number(values.fuelAdjustmentPerLiter) : null,
      status: values.status as CustomerContract['status'],
    };

    if (mode === 'edit') await update.mutateAsync({ contractId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/contracts' });
  }

  return (
    <MasterDataPage
      title="Contracts"
      resource="contracts"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Contract #', render: (row) => row.contractNumber },
        { header: 'Customer', render: (row) => row.customer.name },
        { header: 'Title', render: (row) => row.title },
        { header: 'Status', render: (row) => row.status },
      ]}
      fields={[
        { name: 'customerId', label: 'Customer ID', type: 'number' },
        { name: 'contractNumber', label: 'Contract number' },
        { name: 'title', label: 'Title' },
        { name: 'startDate', label: 'Start date', type: 'date' },
        { name: 'endDate', label: 'End date', type: 'date' },
        {
          name: 'rateModel',
          label: 'Rate model',
          options: Object.values(ContractRateModel).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
        {
          name: 'fuelAdjustmentEnabled',
          label: 'Fuel adjustment',
          options: [
            { label: 'Enabled', value: 'true' },
            { label: 'Disabled', value: 'false' },
          ],
        },
        { name: 'fuelBasePrice', label: 'Fuel base price', type: 'number' },
        { name: 'fuelAdjustmentPerLiter', label: 'Fuel adjustment / liter', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          options: Object.values(ContractStatus).map((value) => ({ label: value, value })),
        },
      ]}
      schema={z.object({
        customerId: z.string().min(1),
        contractNumber: z.string().min(1),
        title: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        rateModel: z.string().min(1),
        fuelAdjustmentEnabled: z.string(),
        fuelBasePrice: z.string(),
        fuelAdjustmentPerLiter: z.string(),
        status: z.string().min(1),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
