import { DataTable, LoadingState, PageHeader, StatsCard } from '@ems/ui';
import { useGetReportsDashboard } from '../api/reports.api';

export function ReportsPage() {
  const report = useGetReportsDashboard();
  const data = report.data?.status === 200 ? report.data.data.data : undefined;
  const vehicleAvailabilityRows = Object.entries(data?.vehicleAvailability ?? {}).map(([station, vehicles]) => ({ station, vehicles }));

  return (
    <section className="dashboard-stack">
      <section className="page-card">
        <PageHeader
          title="Reports"
          description="Operations, receivables, payables, fleet readiness, and estimated profit."
          breadcrumbs="Dashboard / Reports"
        />

        {report.isLoading ? <LoadingState title="Loading reports" message="Preparing the latest dashboard metrics." /> : null}

        {data ? (
          <>
            <div className="stats-grid">
              <StatsCard label="Bookings" value={String(data.bookingsCount)} helper="Total recorded bookings" />
              <StatsCard label="Active trips" value={String(data.activeTripsCount)} helper="Live or planned movement" />
              <StatsCard label="Revenue invoiced" value={data.invoicedRevenueAmount} helper="Current billed revenue" />
              <StatsCard label="Estimated profit" value={data.estimatedProfitAmount} helper="Forecast margin outcome" />
              <StatsCard label="Customer receivable" value={data.customerReceivableAmount} helper="Outstanding customer balance" />
              <StatsCard label="Fuel vendor payable" value={data.fuelVendorPayableAmount} helper="Vendor dues pending" />
              <StatsCard label="Agent payable" value={data.agentCommissionPayableAmount} helper="Commission obligations" />
              <StatsCard label="Actual fuel cost" value={data.actualFuelCostAmount} helper="Captured operating fuel cost" />
            </div>

            <div className="dashboard-grid">
              <section className="page-card panel-card">
                <PageHeader title="Availability by Station" description="Fleet distribution snapshot." />
                <DataTable
                  rows={vehicleAvailabilityRows}
                  columns={[
                    { header: 'Station', render: (row) => row.station.replaceAll('_', ' ') },
                    { header: 'Available vehicles', render: (row) => row.vehicles },
                  ]}
                  getRowKey={(row) => row.station}
                  emptyMessage="No vehicle availability data is available."
                />
              </section>

              <section className="page-card panel-card">
                <PageHeader title="Financial Snapshot" description="Key balances and cost visibility." />
                <div className="summary-grid">
                  <div className="metric-card">
                    <span>Approved driver cash cost</span>
                    <strong>{data.approvedDriverCashCostAmount}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Actual fuel cost</span>
                    <strong>{data.actualFuelCostAmount}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Fuel vendor payable</span>
                    <strong>{data.fuelVendorPayableAmount}</strong>
                  </div>
                  <div className="metric-card">
                    <span>Customer receivable</span>
                    <strong>{data.customerReceivableAmount}</strong>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </section>
  );
}
