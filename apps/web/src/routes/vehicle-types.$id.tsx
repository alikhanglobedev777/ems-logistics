import { createFileRoute } from '@tanstack/react-router';
import { VehicleTypesPage } from '../features/vehicle-types';

export const Route = createFileRoute('/vehicle-types/$id')({
  component: VehicleTypeDetailRoute,
});

function VehicleTypeDetailRoute() {
  const { id } = Route.useParams();
  return <VehicleTypesPage mode="detail" id={id} />;
}
