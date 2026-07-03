import { createFileRoute } from '@tanstack/react-router';
import { DriverSettlementsPage } from '../features/driver-settlements';

export const Route = createFileRoute('/driver-settlements/$id')({ component: DriverSettlementDetailRoute });

function DriverSettlementDetailRoute() {
  const { id } = Route.useParams();
  return <DriverSettlementsPage mode="detail" id={id} />;
}
