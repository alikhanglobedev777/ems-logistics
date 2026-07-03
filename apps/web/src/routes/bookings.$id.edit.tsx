import { createFileRoute } from '@tanstack/react-router';
import { BookingsPage } from '../features/bookings';

export const Route = createFileRoute('/bookings/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <BookingsPage mode="edit" id={id} />;
  },
});
