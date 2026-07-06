import { createFileRoute } from '@tanstack/react-router';
import { DeliveryProofsPage } from '../features/delivery-proofs';

export const Route = createFileRoute('/delivery-proofs/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <DeliveryProofsPage mode="edit" id={id} />;
  },
});
