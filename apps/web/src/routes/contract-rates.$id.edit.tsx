import { createFileRoute } from '@tanstack/react-router';
import { ContractRatesPage } from '../features/contract-rates';

export const Route = createFileRoute('/contract-rates/$id/edit')({
  component: ContractRateEditRoute,
});

function ContractRateEditRoute() {
  const { id } = Route.useParams();
  return <ContractRatesPage mode="edit" id={id} />;
}
