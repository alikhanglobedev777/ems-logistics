import { FuelType } from '@ems/shared';
import { useState } from 'react';
import { useGetRoutes } from '../../routes/api/routes.api';
import { useGetVehicleTypes } from '../../vehicle-types/api/vehicle-types.api';
import { useGetRoutePricingEstimate } from '../api/pricing.api';

export function RoutePricingEstimatePage() {
  const [routeId, setRouteId] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.DIESEL);
  const routes = useGetRoutes({ page: 1, limit: 200 });
  const vehicleTypes = useGetVehicleTypes({ page: 1, limit: 200 });
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
          Route
          <select value={routeId} onChange={(event) => setRouteId(event.target.value)}>
            <option value="">Select route</option>
            {(routes.data?.status === 200 ? routes.data.data.data : []).map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vehicle type
          <select value={vehicleTypeId} onChange={(event) => setVehicleTypeId(event.target.value)}>
            <option value="">Select vehicle type</option>
            {(vehicleTypes.data?.status === 200 ? vehicleTypes.data.data.data : []).map((vehicleType) => (
              <option key={vehicleType.id} value={vehicleType.id}>
                {vehicleType.name}
              </option>
            ))}
          </select>
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

      {!enabled ? <p>Select a route and vehicle type to calculate an internal estimate.</p> : null}
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
