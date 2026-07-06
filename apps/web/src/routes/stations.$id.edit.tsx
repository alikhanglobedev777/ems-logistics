import { createFileRoute } from '@tanstack/react-router';
import { StationsPage } from '../features/stations';

function StationEditRoute() {
  const { id } = Route.useParams();
  return <StationsPage mode="edit" id={id} />;
}

export const Route = createFileRoute('/stations/$id/edit')({
  component: StationEditRoute,
});
