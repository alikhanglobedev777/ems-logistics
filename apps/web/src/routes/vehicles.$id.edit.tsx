import { createFileRoute } from '@tanstack/react-router';
import { VehiclesPage } from '../features/vehicles';

export const Route = createFileRoute('/vehicles/$id/edit')({
  component: VehicleEditRoute,
});

function VehicleEditRoute() {
  const { id } = Route.useParams();
  return <VehiclesPage mode="edit" id={id} />;
}
