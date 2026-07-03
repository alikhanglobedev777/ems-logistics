import { createFileRoute } from '@tanstack/react-router';
import { FuelPricesPage } from '../features/fuel-prices';

export const Route = createFileRoute('/fuel-prices/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <FuelPricesPage mode="detail" id={id} />;
}
