import { createFileRoute } from '@tanstack/react-router';
import { RouteOverheadProfilesPage } from '../features/route-overhead-profiles';

export const Route = createFileRoute('/route-overhead-profiles/new')({
  component: () => <RouteOverheadProfilesPage mode="create" />,
});
