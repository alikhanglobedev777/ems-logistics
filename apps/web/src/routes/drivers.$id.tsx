import { createFileRoute } from '@tanstack/react-router';
import { DriversPage } from '../features/drivers';

export const Route = createFileRoute('/drivers/$id')({
  component: DriverDetailRoute,
});

function DriverDetailRoute() {
  const { id } = Route.useParams();
  return <DriversPage mode="detail" id={id} />;
}
