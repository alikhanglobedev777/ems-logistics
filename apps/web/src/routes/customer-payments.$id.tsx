import { createFileRoute } from '@tanstack/react-router';
import { CustomerPaymentsPage } from '../features/customer-payments';

export const Route = createFileRoute('/customer-payments/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <CustomerPaymentsPage mode="detail" id={id} />;
  },
});
