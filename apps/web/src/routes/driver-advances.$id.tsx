import { createFileRoute } from '@tanstack/react-router';
import { DriverAdvancesPage } from '../features/driver-advances';

export const Route = createFileRoute('/driver-advances/$id')({ component: DriverAdvanceDetailRoute });

function DriverAdvanceDetailRoute() {
  const { id } = Route.useParams();
  return <DriverAdvancesPage mode="detail" id={id} />;
}
