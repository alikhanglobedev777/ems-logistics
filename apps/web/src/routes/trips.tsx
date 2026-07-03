import { createFileRoute } from '@tanstack/react-router';
import { TripsPage } from '../features/trips';

export const Route = createFileRoute('/trips')({
  component: () => <TripsPage mode="list" />,
});
