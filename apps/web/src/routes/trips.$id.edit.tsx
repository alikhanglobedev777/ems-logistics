import { createFileRoute } from '@tanstack/react-router';
import { TripsPage } from '../features/trips';

export const Route = createFileRoute('/trips/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <TripsPage mode="detail" id={id} />;
  },
});
