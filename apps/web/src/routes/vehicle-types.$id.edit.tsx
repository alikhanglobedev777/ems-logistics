import { createFileRoute } from '@tanstack/react-router';
import { VehicleTypesPage } from '../features/vehicle-types';

export const Route = createFileRoute('/vehicle-types/$id/edit')({
  component: VehicleTypeEditRoute,
});

function VehicleTypeEditRoute() {
  const { id } = Route.useParams();
  return <VehicleTypesPage mode="edit" id={id} />;
}
