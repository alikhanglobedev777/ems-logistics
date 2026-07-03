import { useNavigate } from '@tanstack/react-router';
import { FuelPriceSource, FuelType } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateFuelPriceSnapshot,
  useGetFuelPriceSnapshotById,
  useGetFuelPriceSnapshots,
  type FuelPriceSnapshot,
} from '../api/fuel-prices.api';

export function FuelPricesPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetFuelPriceSnapshots({ page: 1, limit: 50 });
  const detail = useGetFuelPriceSnapshotById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateFuelPriceSnapshot();
  const rows: FuelPriceSnapshot[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        fuelType: item.fuelType,
        pricePerLiter: item.pricePerLiter,
        source: item.source,
        effectiveAt: item.effectiveAt.slice(0, 16),
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      data: {
        fuelType: values.fuelType as FuelPriceSnapshot['fuelType'],
        pricePerLiter: Number(values.pricePerLiter),
        source: values.source as FuelPriceSnapshot['source'],
        effectiveAt: new Date(values.effectiveAt).toISOString(),
      },
    });
    await navigate({ to: '/fuel-prices' });
  }

  return (
    <MasterDataPage
      title="Fuel Price Snapshots"
      resource="fuel-prices"
      mode={mode === 'edit' ? 'detail' : mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Fuel type', render: (row) => row.fuelType },
        { header: 'Price/liter', render: (row) => row.pricePerLiter },
        { header: 'Source', render: (row) => row.source },
        { header: 'Effective', render: (row) => new Date(row.effectiveAt).toLocaleString() },
      ]}
      fields={[
        { name: 'fuelType', label: 'Fuel type', options: Object.values(FuelType).map((value) => ({ label: value, value })) },
        { name: 'pricePerLiter', label: 'Price per liter', type: 'number' },
        { name: 'source', label: 'Source', options: Object.values(FuelPriceSource).map((value) => ({ label: value, value })) },
        { name: 'effectiveAt', label: 'Effective at', type: 'datetime-local' },
      ]}
      schema={z.object({
        fuelType: z.string().min(1),
        pricePerLiter: z.string().min(1),
        source: z.string().min(1),
        effectiveAt: z.string().min(1),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
