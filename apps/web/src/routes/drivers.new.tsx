import { createFileRoute } from '@tanstack/react-router';
import { DriversPage } from '../features/drivers';

export const Route = createFileRoute('/drivers/new')({
  component: () => <DriversPage mode="create" />,
});
