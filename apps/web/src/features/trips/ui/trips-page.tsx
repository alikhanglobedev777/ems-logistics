import { DataTable, LoadingState, StatusBadge, getStatusTone } from '@ems/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { TripStatus } from '@ems/shared';
import { TripTimeline } from '../../../components/ui/trip-timeline';
import { useGetDrivers } from '../../drivers/api/drivers.api';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useGetStations } from '../../stations/api/stations.api';
import { useGetVehicles } from '../../vehicles/api/vehicles.api';
import {
  useCompleteTripLeg,
  useCreateMasterTrip,
  useDispatchTripLeg,
  useGetMasterTripById,
  useGetMasterTripLegs,
  useGetMasterTripTimeline,
  useGetMasterTrips,
  type MasterTrip,
  type TripLeg,
} from '../api/trips.api';
import { z } from 'zod';

export function TripsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useGetMasterTrips({ page: 1, limit: 50 });
  const vehicles = useGetVehicles({ page: 1, limit: 200 });
  const drivers = useGetDrivers({ page: 1, limit: 200 });
  const stations = useGetStations({ page: 1, limit: 200 });
  const detail = useGetMasterTripById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const legs = useGetMasterTripLegs(Number(id ?? 0), { query: { enabled: Boolean(id) && mode !== 'create' } });
  const timeline = useGetMasterTripTimeline(Number(id ?? 0), { query: { enabled: Boolean(id) && mode !== 'create' } });
  const create = useCreateMasterTrip();
  const dispatchLeg = useDispatchTripLeg();
  const completeLeg = useCompleteTripLeg();

  const rows: MasterTrip[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const tripLegs = legs.data?.status === 200 ? legs.data.data.data : [];
  const tripEvents = timeline.data?.status === 200 ? timeline.data.data.data : [];
  const vehicleOptions = (vehicles.data?.status === 200 ? vehicles.data.data.data : []).map((entry) => ({
    label: entry.registrationNumber || entry.vehicleNumber,
    value: String(entry.id),
  }));
  const driverOptions = (drivers.data?.status === 200 ? drivers.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));
  const stationOptions = (stations.data?.status === 200 ? stations.data.data.data : []).map((entry) => ({
    label: entry.name,
    value: String(entry.id),
  }));

  const initial = item
    ? {
        vehicleId: String(item.vehicle.id),
        driverId: String(item.driver.id),
        startStationId: String(item.startStation.id),
        plannedStartAt: item.plannedStartAt ?? '',
        createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '',
        status: item.status,
      }
    : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      data: {
        vehicleId: Number(values.vehicleId),
        driverId: Number(values.driverId),
        startStationId: Number(values.startStationId),
        plannedStartAt: values.plannedStartAt || null,
        createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null,
      },
    });

    await navigate({ to: '/trips' });
  }

  async function handleDispatch(legId: number) {
    await dispatchLeg.mutateAsync({ tripLegId: legId });
    await invalidateTripQueries();
  }

  async function handleComplete(legId: number) {
    await completeLeg.mutateAsync({ tripLegId: legId });
    await invalidateTripQueries();
  }

  async function invalidateTripQueries() {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const firstSegment = query.queryKey[0];
        return typeof firstSegment === 'string' && (firstSegment === '/trips' || firstSegment.startsWith('/trips/'));
      },
    });
  }

  return (
    <MasterDataPage
      title="Master Trips"
      resource="trips"
      mode={mode === 'edit' ? 'detail' : mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading || vehicles.isLoading || drivers.isLoading || stations.isLoading}
      description="Dispatch planning, trip execution, and live movement control."
      createLabel="Create trip"
      detailContent={
        item ? (
          <TripDetailPanels
            trip={item}
            legs={tripLegs}
            legsLoading={legs.isLoading}
            events={tripEvents}
            eventsLoading={timeline.isLoading}
            onDispatch={handleDispatch}
            onComplete={handleComplete}
          />
        ) : null
      }
      columns={[
        { header: 'Trip #', render: (row) => row.tripNumber },
        { header: 'Vehicle', render: (row) => row.vehicle.vehicleNumber },
        { header: 'Driver', render: (row) => row.driver.name },
        { header: 'Current station', render: (row) => row.currentStation.name },
        { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
      ]}
      fields={[
        { name: 'vehicleId', label: 'Vehicle', options: vehicleOptions },
        { name: 'driverId', label: 'Driver', options: driverOptions },
        { name: 'startStationId', label: 'Start station', options: stationOptions },
        { name: 'plannedStartAt', label: 'Planned start at', type: 'datetime-local' },
        { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
        {
          name: 'status',
          label: 'Status',
          options: Object.values(TripStatus).map((value) => ({ label: value.replaceAll('_', ' '), value })),
        },
      ]}
      schema={z.object({
        vehicleId: z.string().min(1),
        driverId: z.string().min(1),
        startStationId: z.string().min(1),
        plannedStartAt: z.string().optional().default(''),
        createdByUserId: z.string().optional().default(''),
        status: z.string().optional().default('planned'),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}

function TripDetailPanels({
  trip,
  legs,
  legsLoading,
  events,
  eventsLoading,
  onDispatch,
  onComplete,
}: {
  trip: MasterTrip;
  legs: TripLeg[];
  legsLoading: boolean;
  events: import('../api/trips.api').TripEvent[];
  eventsLoading: boolean;
  onDispatch: (legId: number) => Promise<void>;
  onComplete: (legId: number) => Promise<void>;
}) {
  return (
    <div className="detail-stack">
      <div className="summary-grid">
        <div className="metric-card">
          <span>Vehicle</span>
          <strong>{trip.vehicle.vehicleNumber}</strong>
        </div>
        <div className="metric-card">
          <span>Driver</span>
          <strong>{trip.driver.name}</strong>
        </div>
        <div className="metric-card">
          <span>Start station</span>
          <strong>{trip.startStation.name}</strong>
        </div>
        <div className="metric-card">
          <span>Status</span>
          <strong>{trip.status.replaceAll('_', ' ')}</strong>
        </div>
      </div>

      <div className="detail-two-column">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Trip Timeline</h2>
              <p>Dispatch, movement, and completion events.</p>
            </div>
          </div>
          {eventsLoading ? (
            <LoadingState title="Loading timeline" message="Fetching recorded trip events." compact />
          ) : (
            <TripTimeline events={events} />
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Fuel and Profitability</h2>
              <p>Operational summary for the selected trip.</p>
            </div>
          </div>
          <div className="summary-grid">
            <div className="metric-card">
              <span>Trip legs</span>
              <strong>{legs.length}</strong>
            </div>
            <div className="metric-card">
              <span>Current station</span>
              <strong>{trip.currentStation.name}</strong>
            </div>
            <div className="metric-card">
              <span>Actual start</span>
              <strong>{trip.actualStartAt ?? 'Pending'}</strong>
            </div>
            <div className="metric-card">
              <span>Completed at</span>
              <strong>{trip.completedAt ?? 'Open'}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Trip Legs</h2>
            <p>Route sequencing, stations, and operational actions.</p>
          </div>
        </div>
        <DataTable
          rows={legs}
          columns={[
            { header: 'Leg', render: (row) => `#${row.sequenceNo}` },
            { header: 'Route', render: (row) => row.route.name },
            { header: 'Origin', render: (row) => row.originStation.name },
            { header: 'Destination', render: (row) => row.destinationStation.name },
            { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
            {
              header: 'Actions',
              render: (row) => (
                <span className="table-actions">
                  <button type="button" className="button button-secondary" onClick={() => void onDispatch(row.id)}>
                    Dispatch
                  </button>
                  <button type="button" className="button button-secondary" onClick={() => void onComplete(row.id)}>
                    Complete
                  </button>
                </span>
              ),
            },
          ]}
          getRowKey={(row) => row.id}
          loading={legsLoading}
          emptyMessage="No trip legs have been assigned to this master trip yet."
        />
      </section>
    </div>
  );
}
