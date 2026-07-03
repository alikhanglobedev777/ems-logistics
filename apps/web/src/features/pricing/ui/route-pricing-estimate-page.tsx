import { FuelType } from '@ems/shared';
import { useState } from 'react';
import { useGetRoutePricingEstimate } from '../api/pricing.api';

export function RoutePricingEstimatePage() {
  const [routeId, setRouteId] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.DIESEL);
  const enabled = Boolean(routeId && vehicleTypeId);
  const estimate = useGetRoutePricingEstimate(
    { routeId: Number(routeId || 0), vehicleTypeId: Number(vehicleTypeId || 0), fuelType },
    { query: { enabled } },
  );
  const data = estimate.data?.status === 200 ? estimate.data.data.data : undefined;

  return (
    <section className="page-card">
      <div className="page-heading">
        <div>
          <h1>Route Pricing Estimate</h1>
          <p>Internal-only fuel and overhead estimate. Do not expose hidden overhead to customers.</p>
        </div>
      </div>

      <div className="entity-form">
        <label>
          Route ID
          <input type="number" value={routeId} onChange={(event) => setRouteId(event.target.value)} />
        </label>
        <label>
          Vehicle type ID
          <input type="number" value={vehicleTypeId} onChange={(event) => setVehicleTypeId(event.target.value)} />
        </label>
        <label>
          Fuel type
          <select value={fuelType} onChange={(event) => setFuelType(event.target.value as FuelType)}>
            {Object.values(FuelType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!enabled ? <p>Enter route and vehicle type IDs to calculate an internal estimate.</p> : null}
      {estimate.isLoading ? <p>Loading estimate…</p> : null}
      {estimate.isError ? <p>Estimate unavailable. Check fuel price, route fuel profile, and overhead profile setup.</p> : null}
      {data ? (
        <div className="stats-grid">
          <article className="stat-card">
            <span>Fuel price/liter</span>
            <strong>{data.fuelPriceSnapshot.pricePerLiter}</strong>
          </article>
          <article className="stat-card">
            <span>Estimated fuel cost</span>
            <strong>{data.estimatedFuelCost}</strong>
          </article>
          <article className="stat-card">
            <span>Internal overhead</span>
            <strong>{data.internalOverheadCost}</strong>
          </article>
          <article className="stat-card">
            <span>Minimum suggested cost</span>
            <strong>{data.internalMinimumSuggestedCost}</strong>
          </article>
        </div>
      ) : null}
    </section>
  );
}
