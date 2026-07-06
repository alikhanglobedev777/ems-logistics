import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorPaymentsPage } from '../features/fuel-vendor-payments';

export const Route = createFileRoute('/fuel-vendor-payments/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <FuelVendorPaymentsPage mode="edit" id={id} />;
  },
});
