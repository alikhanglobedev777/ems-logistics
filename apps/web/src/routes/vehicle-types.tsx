import { createFileRoute } from '@tanstack/react-router';
import { VehicleTypesPage } from '../features/vehicle-types';

export const Route = createFileRoute('/vehicle-types')({
  component: () => <VehicleTypesPage mode="list" />,
});
