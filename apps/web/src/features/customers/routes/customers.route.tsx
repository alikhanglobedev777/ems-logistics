import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { CustomersPage } from '../ui/customers-page';

export function createCustomersRoutes(parentRoute: AnyRoute) {
  const listRoute = createRoute({ getParentRoute: () => parentRoute, path: '/customers', component: () => <CustomersPage mode="list" /> });
  const createRouteNode = createRoute({ getParentRoute: () => parentRoute, path: '/customers/new', component: () => <CustomersPage mode="create" /> });
  const detailRoute = createRoute({ getParentRoute: () => parentRoute, path: '/customers/$id', component: () => { const { id } = detailRoute.useParams() as { id: string }; return <CustomersPage mode="detail" id={id} />; } });
  const editRoute = createRoute({ getParentRoute: () => parentRoute, path: '/customers/$id/edit', component: () => { const { id } = editRoute.useParams() as { id: string }; return <CustomersPage mode="edit" id={id} />; } });
  return [listRoute, createRouteNode, detailRoute, editRoute];
}
