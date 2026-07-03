import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { DriversPage } from '../ui/drivers-page';

export function createDriversRoutes(parentRoute: AnyRoute) {
  const listRoute = createRoute({ getParentRoute: () => parentRoute, path: '/drivers', component: () => <DriversPage mode="list" /> });
  const createRouteNode = createRoute({ getParentRoute: () => parentRoute, path: '/drivers/new', component: () => <DriversPage mode="create" /> });
  const detailRoute = createRoute({ getParentRoute: () => parentRoute, path: '/drivers/$id', component: () => { const { id } = detailRoute.useParams() as { id: string }; return <DriversPage mode="detail" id={id} />; } });
  const editRoute = createRoute({ getParentRoute: () => parentRoute, path: '/drivers/$id/edit', component: () => { const { id } = editRoute.useParams() as { id: string }; return <DriversPage mode="edit" id={id} />; } });
  return [listRoute, createRouteNode, detailRoute, editRoute];
}
