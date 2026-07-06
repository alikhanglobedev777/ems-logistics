import { createFileRoute } from '@tanstack/react-router';
import { CustomerInvoicesPage } from '../features/customer-invoices';

export const Route = createFileRoute('/customer-invoices/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <CustomerInvoicesPage mode="detail" id={id} />;
  },
});
