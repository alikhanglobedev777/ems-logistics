import { createFileRoute } from '@tanstack/react-router';
import { CustomerPaymentsPage } from '../features/customer-payments';

export const Route = createFileRoute('/customer-payments')({
  component: () => <CustomerPaymentsPage mode="list" />,
});
