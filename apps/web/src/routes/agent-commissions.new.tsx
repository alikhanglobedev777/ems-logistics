import { createFileRoute } from '@tanstack/react-router';
import { AgentCommissionsPage } from '../features/agent-commissions';

export const Route = createFileRoute('/agent-commissions/new')({
  component: () => <AgentCommissionsPage mode="create" />,
});
