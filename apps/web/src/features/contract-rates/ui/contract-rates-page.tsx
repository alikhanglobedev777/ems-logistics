import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useGetContracts } from '../../contracts/api/contracts.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetRoutes } from '../../routes/api/routes.api';
import { useGetVehicleTypes } from '../../vehicle-types/api/vehicle-types.api';
import {
  useCreateContractRate,
  useGetContractRateById,
  useGetContractRates,
  useUpdateContractRate,
  type ContractRate,
} from '../api/contract-rates.api';

export function ContractRatesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetContractRates({ page: 1, limit: 50 });
  const contracts = useGetContracts({ page: 1, limit: 200 });
  const routes = useGetRoutes({ page: 1, limit: 200 });
  const vehicleTypes = useGetVehicleTypes({ page: 1, limit: 200 });
  const detail = useGetContractRateById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateContractRate();
  const update = useUpdateContractRate();
  const rows: ContractRate[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const contractOptions = (contracts.data?.status === 200 ? contracts.data.data.data : []).map((entry) => ({
    label: `${entry.contractNumber} — ${entry.title}`,
    value: String(entry.id),
  }));
  const routeOptions = (routes.data?.status === 200 ? routes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const vehicleTypeOptions = (vehicleTypes.data?.status === 200 ? vehicleTypes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));

  const initial = item
    ? {
        contractId: String(item.contract.id),
        routeId: String(item.route.id),
        vehicleTypeId: String(item.vehicleType.id),
        baseFreightRate: item.baseFreightRate,
        minimumMarginPercent: item.minimumMarginPercent,
        loadingCharges: item.loadingCharges,
        unloadingCharges: item.unloadingCharges,
        taxPercent: item.taxPercent,
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      contractId: Number(values.contractId),
      routeId: Number(values.routeId),
      vehicleTypeId: Number(values.vehicleTypeId),
      baseFreightRate: Number(values.baseFreightRate),
      minimumMarginPercent: values.minimumMarginPercent ? Number(values.minimumMarginPercent) : 0,
      loadingCharges: values.loadingCharges ? Number(values.loadingCharges) : 0,
      unloadingCharges: values.unloadingCharges ? Number(values.unloadingCharges) : 0,
      taxPercent: values.taxPercent ? Number(values.taxPercent) : 0,
      isActive: values.isActive !== 'false',
    };

    if (mode === 'edit') await update.mutateAsync({ contractRateId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/contract-rates' });
  }

  return (
    <MasterDataPage
      title="Contract Rates"
      resource="contract-rates"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading || contracts.isLoading || routes.isLoading || vehicleTypes.isLoading}
      columns={[
        { header: 'Contract', render: (row) => row.contract.contractNumber },
        { header: 'Route', render: (row) => row.route.name },
        { header: 'Vehicle type', render: (row) => row.vehicleType.name },
        { header: 'Base rate', render: (row) => row.baseFreightRate },
      ]}
      fields={[
        { name: 'contractId', label: 'Contract', options: contractOptions },
        { name: 'routeId', label: 'Route', options: routeOptions },
        { name: 'vehicleTypeId', label: 'Vehicle type', options: vehicleTypeOptions },
        { name: 'baseFreightRate', label: 'Base freight rate', type: 'number' },
        { name: 'minimumMarginPercent', label: 'Minimum margin %', type: 'number' },
        { name: 'loadingCharges', label: 'Loading charges', type: 'number' },
        { name: 'unloadingCharges', label: 'Unloading charges', type: 'number' },
        { name: 'taxPercent', label: 'Tax %', type: 'number' },
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
        contractId: z.string().min(1),
        routeId: z.string().min(1),
        vehicleTypeId: z.string().min(1),
        baseFreightRate: z.string().min(1),
        minimumMarginPercent: z.string(),
        loadingCharges: z.string(),
        unloadingCharges: z.string(),
        taxPercent: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
