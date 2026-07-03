import { createFileRoute } from '@tanstack/react-router';
import { ContractRatesPage } from '../features/contract-rates';

export const Route = createFileRoute('/contract-rates/$id')({
  component: ContractRateDetailRoute,
});

function ContractRateDetailRoute() {
  const { id } = Route.useParams();
  return <ContractRatesPage mode="detail" id={id} />;
}
