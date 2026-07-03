import { StatsCard } from '@ems/ui';

export function DashboardPage() {
  return (
    <section className="page-card hero-panel">
      <p className="eyebrow">EMS CONTROL CENTER</p>
      <h1>Master data, ready for operations.</h1>
      <p>Build the fleet, driver, customer, and agent records that bookings and trips will depend on.</p>
      <div className="stats-grid">
        <StatsCard label="Fleet setup" value="Vehicles" />
        <StatsCard label="People" value="Drivers" />
        <StatsCard label="Revenue parties" value="Customers" />
      </div>
    </section>
  );
}
