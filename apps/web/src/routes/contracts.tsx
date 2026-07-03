import { createFileRoute } from '@tanstack/react-router';
import { ContractsPage } from '../features/contracts';

export const Route = createFileRoute('/contracts')({
  component: () => <ContractsPage mode="list" />,
});
