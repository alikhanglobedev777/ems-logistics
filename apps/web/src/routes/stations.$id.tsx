import { createFileRoute } from '@tanstack/react-router';
import { StationsPage } from '../features/stations';

function StationDetailRoute() {
  const { id } = Route.useParams();
  return <StationsPage mode="detail" id={id} />;
}

export const Route = createFileRoute('/stations/$id')({
  component: StationDetailRoute,
});
