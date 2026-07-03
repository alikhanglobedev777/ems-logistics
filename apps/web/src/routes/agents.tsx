import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '../features/agents';

export const Route = createFileRoute('/agents')({
  component: () => <AgentsPage mode="list" />,
});
