import { createFileRoute } from '@tanstack/react-router';
import { StationsPage } from '../features/stations';

export const Route = createFileRoute('/stations')({
  component: () => <StationsPage mode="list" />,
});
