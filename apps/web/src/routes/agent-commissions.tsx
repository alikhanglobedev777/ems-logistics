import { createFileRoute } from '@tanstack/react-router';
import { AgentCommissionsPage } from '../features/agent-commissions';

export const Route = createFileRoute('/agent-commissions')({
  component: () => <AgentCommissionsPage mode="list" />,
});
