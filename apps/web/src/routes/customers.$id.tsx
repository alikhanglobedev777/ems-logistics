import { createFileRoute } from '@tanstack/react-router';
import { CustomersPage } from '../features/customers';

export const Route = createFileRoute('/customers/$id')({
  component: CustomerDetailRoute,
});

function CustomerDetailRoute() {
  const { id } = Route.useParams();
  return <CustomersPage mode="detail" id={id} />;
}
