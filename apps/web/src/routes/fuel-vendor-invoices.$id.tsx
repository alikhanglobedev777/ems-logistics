import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorInvoicesPage } from '../features/fuel-vendor-invoices';

export const Route = createFileRoute('/fuel-vendor-invoices/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <FuelVendorInvoicesPage mode="detail" id={id} />;
  },
});
