import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorsPage } from '../features/fuel-vendors';

export const Route = createFileRoute('/fuel-vendors/$id')({
  component: FuelVendorDetailRoute,
});

function FuelVendorDetailRoute() {
  const { id } = Route.useParams();
  return <FuelVendorsPage mode="detail" id={id} />;
}
