import { createFileRoute } from '@tanstack/react-router';
import { VehiclesPage } from '../features/vehicles';

export const Route = createFileRoute('/vehicles/$id')({
  component: VehicleDetailRoute,
});

function VehicleDetailRoute() {
  const { id } = Route.useParams();
  return <VehiclesPage mode="detail" id={id} />;
}
