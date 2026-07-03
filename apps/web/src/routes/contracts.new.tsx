import { createFileRoute } from '@tanstack/react-router';
import { ContractsPage } from '../features/contracts';

export const Route = createFileRoute('/contracts/new')({
  component: () => <ContractsPage mode="create" />,
});
