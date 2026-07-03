import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { VehiclesPage } from '../ui/vehicles-page';

export function createVehiclesRoutes(parentRoute: AnyRoute) {
  const listRoute = createRoute({ getParentRoute: () => parentRoute, path: '/vehicles', component: () => <VehiclesPage mode="list" /> });
  const createRouteNode = createRoute({ getParentRoute: () => parentRoute, path: '/vehicles/new', component: () => <VehiclesPage mode="create" /> });
  const detailRoute = createRoute({ getParentRoute: () => parentRoute, path: '/vehicles/$id', component: () => { const { id } = detailRoute.useParams() as { id: string }; return <VehiclesPage mode="detail" id={id} />; } });
  const editRoute = createRoute({ getParentRoute: () => parentRoute, path: '/vehicles/$id/edit', component: () => { const { id } = editRoute.useParams() as { id: string }; return <VehiclesPage mode="edit" id={id} />; } });
  return [listRoute, createRouteNode, detailRoute, editRoute];
}
