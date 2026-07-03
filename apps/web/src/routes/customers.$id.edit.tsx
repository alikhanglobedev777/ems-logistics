import { createFileRoute } from '@tanstack/react-router';
import { CustomersPage } from '../features/customers';

export const Route = createFileRoute('/customers/$id/edit')({
  component: CustomerEditRoute,
});

function CustomerEditRoute() {
  const { id } = Route.useParams();
  return <CustomersPage mode="edit" id={id} />;
}
