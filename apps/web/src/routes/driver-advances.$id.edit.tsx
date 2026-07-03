import { createFileRoute } from '@tanstack/react-router';
import { DriverAdvancesPage } from '../features/driver-advances';

export const Route = createFileRoute('/driver-advances/$id/edit')({ component: DriverAdvanceEditRoute });

function DriverAdvanceEditRoute() {
  const { id } = Route.useParams();
  return <DriverAdvancesPage mode="edit" id={id} />;
}
