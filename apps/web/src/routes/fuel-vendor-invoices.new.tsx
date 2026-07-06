import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorInvoicesPage } from '../features/fuel-vendor-invoices';

export const Route = createFileRoute('/fuel-vendor-invoices/new')({
  component: () => <FuelVendorInvoicesPage mode="create" />,
});
