import { createFileRoute } from '@tanstack/react-router';
import { DriverSettlementsPage } from '../features/driver-settlements';

export const Route = createFileRoute('/driver-settlements/$id/edit')({ component: DriverSettlementEditRoute });

function DriverSettlementEditRoute() {
  const { id } = Route.useParams();
  return <DriverSettlementsPage mode="edit" id={id} />;
}
