import { createFileRoute } from '@tanstack/react-router';
import { ContractRatesPage } from '../features/contract-rates';

export const Route = createFileRoute('/contract-rates')({
  component: () => <ContractRatesPage mode="list" />,
});
