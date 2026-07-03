import { createFileRoute } from '@tanstack/react-router';
import { BookingsPage } from '../features/bookings';

export const Route = createFileRoute('/bookings/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <BookingsPage mode="detail" id={id} />;
  },
});
