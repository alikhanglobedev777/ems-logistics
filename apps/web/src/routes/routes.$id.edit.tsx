import { createFileRoute } from '@tanstack/react-router';
import { RoutesPage } from '../features/routes';

export const Route = createFileRoute('/routes/$id/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <RoutesPage mode="edit" id={id} />;
}
