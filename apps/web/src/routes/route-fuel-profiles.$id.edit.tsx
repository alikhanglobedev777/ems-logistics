import { createFileRoute } from '@tanstack/react-router';
import { RouteFuelProfilesPage } from '../features/route-fuel-profiles';

export const Route = createFileRoute('/route-fuel-profiles/$id/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <RouteFuelProfilesPage mode="edit" id={id} />;
}
