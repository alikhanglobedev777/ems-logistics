import { createFileRoute } from '@tanstack/react-router';
import { FuelPricesPage } from '../features/fuel-prices';

export const Route = createFileRoute('/fuel-prices')({
  component: () => <FuelPricesPage mode="list" />,
});
