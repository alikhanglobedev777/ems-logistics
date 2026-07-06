import { createFileRoute } from '@tanstack/react-router';
import { FuelVendorsPage } from '../features/fuel-vendors';

export const Route = createFileRoute('/fuel-vendors/$id/edit')({
  component: FuelVendorEditRoute,
});

function FuelVendorEditRoute() {
  const { id } = Route.useParams();
  return <FuelVendorsPage mode="edit" id={id} />;
}
