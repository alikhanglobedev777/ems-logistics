import { createFileRoute } from '@tanstack/react-router';
import { RoutesPage } from '../features/routes';

export const Route = createFileRoute('/routes/new')({
  component: () => <RoutesPage mode="create" />,
});
