import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { VehicleTypesPage } from '../ui/vehicle-types-page';

export function createVehicleTypesRoutes(parentRoute: AnyRoute) {
  const listRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/vehicle-types',
    component: () => <VehicleTypesPage mode="list" />,
  });

  const createRouteNode = createRoute({
    getParentRoute: () => parentRoute,
    path: '/vehicle-types/new',
    component: () => <VehicleTypesPage mode="create" />,
  });

  const detailRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/vehicle-types/$id',
    component: () => {
      const { id } = detailRoute.useParams() as { id: string };
      return <VehicleTypesPage mode="detail" id={id} />;
    },
  });

  const editRoute = createRoute({
    getParentRoute: () => parentRoute,
    path: '/vehicle-types/$id/edit',
    component: () => {
      const { id } = editRoute.useParams() as { id: string };
      return <VehicleTypesPage mode="edit" id={id} />;
    },
  });

  return [listRoute, createRouteNode, detailRoute, editRoute];
}
