import { createFileRoute } from '@tanstack/react-router';
import { VehiclesPage } from '../features/vehicles';

export const Route = createFileRoute('/vehicles/new')({
  component: () => <VehiclesPage mode="create" />,
});
