import { createFileRoute } from '@tanstack/react-router';
import { FuelSlipsPage } from '../features/fuel-slips';

export const Route = createFileRoute('/fuel-slips/new')({
  component: () => <FuelSlipsPage mode="create" />,
});
