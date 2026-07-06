import { DataTable, PageHeader, StatsCard, StatusBadge, getStatusTone } from '@ems/ui';
import { useGetBookings } from '../../bookings/api/bookings.api';
import { useGetFuelSlips } from '../../fuel-slips/api/fuel-slips.api';
import { useGetReportsDashboard } from '../../reports/api/reports.api';
import { useGetMasterTrips } from '../../trips/api/trips.api';
import { useGetVehicles } from '../../vehicles/api/vehicles.api';

export function DashboardPage() {
  const reports = useGetReportsDashboard();
  const trips = useGetMasterTrips({ page: 1, limit: 5 });
  const bookings = useGetBookings({ page: 1, limit: 5 });
  const fuelSlips = useGetFuelSlips({ page: 1, limit: 5 });
  const vehicles = useGetVehicles({ page: 1, limit: 100 });

  const report = reports.data?.status === 200 ? reports.data.data.data : undefined;
  const tripRows = trips.data?.status === 200 ? trips.data.data.data : [];
  const bookingRows = bookings.data?.status === 200 ? bookings.data.data.data : [];
  const fuelSlipRows = fuelSlips.data?.status === 200 ? fuelSlips.data.data.data : [];
  const vehicleRows = vehicles.data?.status === 200 ? vehicles.data.data.data : [];

  const availableVehicles = vehicleRows.filter((vehicle) => vehicle.isActive).length;
  const pendingFuelSlips = fuelSlipRows.filter((slip) => slip.status.toLowerCase() === 'pending').length;

  return (
    <section className="dashboard-stack">
      <section className="page-card dashboard-hero">
        <PageHeader
          title="Operations Overview"
          description="Enterprise command center for dispatch, fleet readiness, receivables, and fuel operations."
          breadcrumbs="Dashboard"
        />

        <div className="stats-grid dashboard-stats">
          <StatsCard label="Total Bookings" value={String(report?.bookingsCount ?? bookingRows.length)} helper="Current billing workload" />
          <StatsCard label="Active Trips" value={String(report?.activeTripsCount ?? tripRows.length)} helper="Trips in motion or planned" />
          <StatsCard label="Available Vehicles" value={String(availableVehicles)} helper="Active fleet records loaded" />
          <StatsCard label="Pending Fuel Slips" value={String(pendingFuelSlips)} helper="Verification queue" />
          <StatsCard label="Receivables" value={report?.customerReceivableAmount ?? '--'} helper="Customer balance outstanding" />
          <StatsCard label="Fuel Vendor Payables" value={report?.fuelVendorPayableAmount ?? '--'} helper="Vendor settlement exposure" />
          <StatsCard label="Today's Revenue" value={report?.invoicedRevenueAmount ?? '--'} helper="Current invoiced revenue" />
          <StatsCard label="Estimated Profit" value={report?.estimatedProfitAmount ?? '--'} helper="Margin forecast from live ops" />
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="page-card">
          <PageHeader title="Active Trips" description="Recent trip activity and dispatch status." />
          <DataTable
            rows={tripRows}
            columns={[
              { header: 'Trip #', render: (row) => row.tripNumber },
              { header: 'Vehicle', render: (row) => row.vehicle.vehicleNumber },
              { header: 'Driver', render: (row) => row.driver.name },
              { header: 'Station', render: (row) => row.currentStation.name },
              { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
            ]}
            getRowKey={(row) => row.id}
            loading={trips.isLoading}
            emptyMessage="No active trips are available yet."
          />
        </section>

        <section className="page-card">
          <PageHeader title="Recent Bookings" description="Latest bilty records entering the operations pipeline." />
          <DataTable
            rows={bookingRows}
            columns={[
              { header: 'Bilty #', render: (row) => row.bookingNumber },
              { header: 'Customer', render: (row) => row.customer.name },
              { header: 'Route', render: (row) => row.route?.name ?? '--' },
              { header: 'Freight', render: (row) => row.totalCustomerAmount },
              { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
            ]}
            getRowKey={(row) => row.id}
            loading={bookings.isLoading}
            emptyMessage="No recent bookings are available."
          />
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="page-card">
          <PageHeader title="Vehicle Availability by Station" description="Operational vehicle counts derived from reporting data." />
          <div className="summary-grid">
            {Object.entries(report?.vehicleAvailability ?? {}).map(([station, count]) => (
              <div key={station} className="metric-card">
                <span>{station.replaceAll('_', ' ')}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="page-card">
          <PageHeader title="Fuel Verification Queue" description="Fuel slips waiting for approval or review." />
          <DataTable
            rows={fuelSlipRows}
            columns={[
              { header: 'Slip #', render: (row) => row.slipNumber },
              { header: 'Vendor', render: (row) => row.vendor.name },
              { header: 'Vehicle', render: (row) => row.vehicle.registrationNumber },
              { header: 'Amount', render: (row) => row.totalAmount },
              { header: 'Status', render: (row) => <StatusBadge label={row.status} tone={getStatusTone(row.status)} /> },
            ]}
            getRowKey={(row) => row.id}
            loading={fuelSlips.isLoading}
            emptyMessage="No fuel slips are waiting in the queue."
          />
        </section>
      </div>
    </section>
  );
}
