import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetRoutes } from '../../routes/api/routes.api';
import { useGetVehicleTypes } from '../../vehicle-types/api/vehicle-types.api';
import {
  useCreateRouteOverheadProfile,
  useGetRouteOverheadProfileById,
  useGetRouteOverheadProfiles,
  useUpdateRouteOverheadProfile,
  type RouteOverheadProfile,
} from '../api/route-overhead-profiles.api';

const costFields = [
  ['maintenanceCost', 'Maintenance cost'],
  ['tyreCost', 'Tyre cost'],
  ['oilServiceCost', 'Oil/service cost'],
  ['depreciationCost', 'Depreciation cost'],
  ['insuranceTaxCost', 'Insurance/tax cost'],
  ['routeRiskCost', 'Route risk cost'],
  ['emptyReturnRiskCost', 'Empty return risk cost'],
  ['workshopReserveCost', 'Workshop reserve cost'],
] as const;

export function RouteOverheadProfilesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetRouteOverheadProfiles({ page: 1, limit: 50 });
  const routes = useGetRoutes({ page: 1, limit: 200 });
  const vehicleTypes = useGetVehicleTypes({ page: 1, limit: 200 });
  const detail = useGetRouteOverheadProfileById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateRouteOverheadProfile();
  const update = useUpdateRouteOverheadProfile();
  const rows: RouteOverheadProfile[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const routeOptions = (routes.data?.status === 200 ? routes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const vehicleTypeOptions = (vehicleTypes.data?.status === 200 ? vehicleTypes.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const initial = item
    ? Object.fromEntries([
        ['routeId', String(item.route.id)],
        ['vehicleTypeId', String(item.vehicleType.id)],
        ...costFields.map(([name]) => [name, String(item[name])]),
        ['isActive', String(item.isActive)],
      ])
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      routeId: Number(values.routeId),
      vehicleTypeId: Number(values.vehicleTypeId),
      maintenanceCost: Number(values.maintenanceCost || 0),
      tyreCost: Number(values.tyreCost || 0),
      oilServiceCost: Number(values.oilServiceCost || 0),
      depreciationCost: Number(values.depreciationCost || 0),
      insuranceTaxCost: Number(values.insuranceTaxCost || 0),
      routeRiskCost: Number(values.routeRiskCost || 0),
      emptyReturnRiskCost: Number(values.emptyReturnRiskCost || 0),
      workshopReserveCost: Number(values.workshopReserveCost || 0),
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ routeOverheadProfileId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/route-overhead-profiles' });
  }

  return (
    <MasterDataPage
      title="Route Overhead Profiles"
      resource="route-overhead-profiles"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading || routes.isLoading || vehicleTypes.isLoading}
      columns={[
        { header: 'Route', render: (row) => row.route.name },
        { header: 'Vehicle type', render: (row) => row.vehicleType.name },
        { header: 'Total overhead', render: (row) => row.totalOverhead },
        { header: 'Active', render: (row) => (row.isActive ? 'Yes' : 'No') },
      ]}
      fields={[
        { name: 'routeId', label: 'Route', options: routeOptions },
        { name: 'vehicleTypeId', label: 'Vehicle type', options: vehicleTypeOptions },
        ...costFields.map(([name, label]) => ({ name, label, type: 'number' })),
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
        routeId: z.string().min(1),
        vehicleTypeId: z.string().min(1),
        maintenanceCost: z.string(),
        tyreCost: z.string(),
        oilServiceCost: z.string(),
        depreciationCost: z.string(),
        insuranceTaxCost: z.string(),
        routeRiskCost: z.string(),
        emptyReturnRiskCost: z.string(),
        workshopReserveCost: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
