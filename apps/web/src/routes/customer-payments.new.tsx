import { createFileRoute } from '@tanstack/react-router';
import { CustomerPaymentsPage } from '../features/customer-payments';

export const Route = createFileRoute('/customer-payments/new')({
  component: () => <CustomerPaymentsPage mode="create" />,
});
