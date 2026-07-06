import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useGetCities } from '../../cities/api/cities.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import {
  useCreateStation,
  useGetStationById,
  useGetStations,
  useUpdateStation,
  type Station,
} from '../api/stations.api';

export function StationsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetStations({ isActive: true });
  const cities = useGetCities();
  const detail = useGetStationById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateStation();
  const update = useUpdateStation();

  const rows: Station[] = list.data?.status === 200 ? list.data.data.data : [];
  const cityRows = cities.data?.status === 200 ? cities.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;

  const initial = item
    ? {
        cityId: String(item.cityId),
        name: item.name,
        code: item.code ?? '',
        address: item.address ?? '',
        contactPhone: item.contactPhone ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      cityId: Number(values.cityId),
      name: values.name,
      code: values.code || null,
      address: values.address || null,
      contactPhone: values.contactPhone || null,
      ...(mode === 'edit' ? { isActive: values.isActive !== 'false' } : {}),
    };

    if (mode === 'edit') {
      await update.mutateAsync({ stationId: Number(id), data });
    } else {
      await create.mutateAsync({ data });
    }

    await navigate({ to: '/stations' });
  }

  return (
    <MasterDataPage
      title="Stations"
      resource="stations"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || cities.isLoading || detail.isLoading}
      description="Create and maintain operational stations for vehicles, bookings, and trip routing."
      createLabel="Create station"
      columns={[
        { header: 'Code', render: (row) => row.code ?? '--' },
        { header: 'Station', render: (row) => row.name },
        { header: 'City', render: (row) => row.cityName },
        { header: 'Phone', render: (row) => row.contactPhone ?? '--' },
        { header: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
      ]}
      fields={[
        {
          name: 'cityId',
          label: 'City',
          options: cityRows.map((city) => ({
            label: city.name,
            value: String(city.id),
          })),
        },
        { name: 'name', label: 'Station name' },
        { name: 'code', label: 'Code' },
        { name: 'address', label: 'Address' },
        { name: 'contactPhone', label: 'Contact phone' },
        ...(mode === 'edit'
          ? [
              {
                name: 'isActive',
                label: 'Status',
                options: [
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' },
                ],
              },
            ]
          : []),
      ]}
      schema={z.object({
        cityId: z.string().min(1),
        name: z.string().min(1),
        code: z.string().optional().default(''),
        address: z.string().optional().default(''),
        contactPhone: z.string().optional().default(''),
        isActive: z.string().optional().default('true'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
