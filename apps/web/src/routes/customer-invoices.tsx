import { createFileRoute } from '@tanstack/react-router';
import { CustomerInvoicesPage } from '../features/customer-invoices';

export const Route = createFileRoute('/customer-invoices')({
  component: () => <CustomerInvoicesPage mode="list" />,
});
