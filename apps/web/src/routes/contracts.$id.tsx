import { createFileRoute } from '@tanstack/react-router';
import { ContractsPage } from '../features/contracts';

export const Route = createFileRoute('/contracts/$id')({
  component: ContractDetailRoute,
});

function ContractDetailRoute() {
  const { id } = Route.useParams();
  return <ContractsPage mode="detail" id={id} />;
}
