import { createRoute, type AnyRoute } from '@tanstack/react-router';
import { DashboardPage } from '../ui/dashboard-page';

export function createDashboardRoute(parentRoute: AnyRoute) {
  return createRoute({
    getParentRoute: () => parentRoute,
    path: '/',
    component: DashboardPage,
  });
}
