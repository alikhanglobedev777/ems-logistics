import { createFileRoute } from '@tanstack/react-router';
import { CustomerInvoicesPage } from '../features/customer-invoices';

export const Route = createFileRoute('/customer-invoices/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <CustomerInvoicesPage mode="edit" id={id} />;
  },
});
