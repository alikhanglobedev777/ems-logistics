import type { BookingPricingSnapshot } from '@ems/api-client';
import { EmptyState, StatusBadge, getStatusTone } from '@ems/ui';

export function PricingSnapshotPanel({ snapshot }: { snapshot?: BookingPricingSnapshot }) {
  if (!snapshot) {
    return (
      <EmptyState
        title="Pricing snapshot unavailable"
        message="This booking does not have a calculated pricing snapshot yet."
        compact
      />
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Pricing Snapshot</h2>
          <p>Internal logistics costing, fuel assumptions, and margin view.</p>
        </div>
        <StatusBadge label={snapshot.pricingSource.replaceAll('_', ' ')} tone={getStatusTone(snapshot.pricingSource)} />
      </div>
      <div className="summary-grid">
        <MetricCard label="Fuel price / liter" value={snapshot.fuelPricePerLiter} />
        <MetricCard label="Expected liters" value={snapshot.expectedLiters} />
        <MetricCard label="Estimated fuel cost" value={snapshot.estimatedFuelCost} />
        <MetricCard label="Internal overhead" value={snapshot.internalOverheadCost} />
        <MetricCard label="Suggested freight" value={snapshot.suggestedFreightRate} />
        <MetricCard label="Final freight" value={snapshot.finalFreightRate} />
        <MetricCard label="Margin amount" value={snapshot.estimatedMarginAmount} />
        <MetricCard label="Margin percent" value={`${snapshot.estimatedMarginPercent}%`} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
