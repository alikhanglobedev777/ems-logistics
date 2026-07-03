import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '../features/agents';

export const Route = createFileRoute('/agents/new')({
  component: () => <AgentsPage mode="create" />,
});
