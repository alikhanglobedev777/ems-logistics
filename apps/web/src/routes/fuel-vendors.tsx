import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorsPage } from '../features/fuel-vendors';

export const Route = createFileRoute('/fuel-vendors')({
  component: () => <FuelVendorsPage mode="list" />,
});
