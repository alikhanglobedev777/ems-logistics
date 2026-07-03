import { createFileRoute } from '@tanstack/react-router';
import { RouteFuelProfilesPage } from '../features/route-fuel-profiles';

export const Route = createFileRoute('/route-fuel-profiles/new')({
  component: () => <RouteFuelProfilesPage mode="create" />,
});
