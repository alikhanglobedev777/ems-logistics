import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorPaymentsPage } from '../features/fuel-vendor-payments';

export const Route = createFileRoute('/fuel-vendor-payments/new')({
  component: () => <FuelVendorPaymentsPage mode="create" />,
});
