import { createFileRoute } from '@tanstack/react-router';
import { RouteOverheadProfilesPage } from '../features/route-overhead-profiles';

export const Route = createFileRoute('/route-overhead-profiles/$id/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <RouteOverheadProfilesPage mode="edit" id={id} />;
}
