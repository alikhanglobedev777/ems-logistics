import { createFileRoute } from '@tanstack/react-router';
import { ContractsPage } from '../features/contracts';

export const Route = createFileRoute('/contracts/$id/edit')({
  component: ContractEditRoute,
});

function ContractEditRoute() {
  const { id } = Route.useParams();
  return <ContractsPage mode="edit" id={id} />;
}
