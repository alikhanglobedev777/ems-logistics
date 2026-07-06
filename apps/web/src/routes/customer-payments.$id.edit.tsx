import { createFileRoute } from '@tanstack/react-router';
import { CustomerPaymentsPage } from '../features/customer-payments';

export const Route = createFileRoute('/customer-payments/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <CustomerPaymentsPage mode="edit" id={id} />;
  },
});
