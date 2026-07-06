import { createFileRoute } from '@tanstack/react-router';
import { DeliveryProofsPage } from '../features/delivery-proofs';

export const Route = createFileRoute('/delivery-proofs')({
  component: () => <DeliveryProofsPage mode="list" />,
});
