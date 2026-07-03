import { createFileRoute } from '@tanstack/react-router';
import { CustomersPage } from '../features/customers';

export const Route = createFileRoute('/customers/new')({
  component: () => <CustomersPage mode="create" />,
});
