import { createFileRoute } from '@tanstack/react-router';
import { FuelSlipsPage } from '../features/fuel-slips';

export const Route = createFileRoute('/fuel-slips/$id')({
  component: FuelSlipDetailRoute,
});

function FuelSlipDetailRoute() {
  const { id } = Route.useParams();
  return <FuelSlipsPage mode="detail" id={id} />;
}
