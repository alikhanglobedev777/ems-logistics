import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { AgentsPage } from '../ui/agents-page';

export function createAgentsRoutes(parentRoute: AnyRoute) {
  const listRoute = createRoute({ getParentRoute: () => parentRoute, path: '/agents', component: () => <AgentsPage mode="list" /> });
  const createRouteNode = createRoute({ getParentRoute: () => parentRoute, path: '/agents/new', component: () => <AgentsPage mode="create" /> });
  const detailRoute = createRoute({ getParentRoute: () => parentRoute, path: '/agents/$id', component: () => { const { id } = detailRoute.useParams() as { id: string }; return <AgentsPage mode="detail" id={id} />; } });
  const editRoute = createRoute({ getParentRoute: () => parentRoute, path: '/agents/$id/edit', component: () => { const { id } = editRoute.useParams() as { id: string }; return <AgentsPage mode="edit" id={id} />; } });
  return [listRoute, createRouteNode, detailRoute, editRoute];
}
