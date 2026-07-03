import { createFileRoute } from '@tanstack/react-router';
import { DriversPage } from '../features/drivers';

export const Route = createFileRoute('/drivers/$id/edit')({
  component: DriverEditRoute,
});

function DriverEditRoute() {
  const { id } = Route.useParams();
  return <DriversPage mode="edit" id={id} />;
}
