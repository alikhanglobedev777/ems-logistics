import { createFileRoute } from '@tanstack/react-router';
import { FuelSlipsPage } from '../features/fuel-slips';

export const Route = createFileRoute('/fuel-slips/$id/edit')({
  component: FuelSlipEditRoute,
});

function FuelSlipEditRoute() {
  const { id } = Route.useParams();
  return <FuelSlipsPage mode="edit" id={id} />;
}
