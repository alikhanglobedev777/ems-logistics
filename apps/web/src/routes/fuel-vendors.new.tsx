import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorsPage } from '../features/fuel-vendors';

export const Route = createFileRoute('/fuel-vendors/new')({
  component: () => <FuelVendorsPage mode="create" />,
});
