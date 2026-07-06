import { createFileRoute } from '@tanstack/react-router';
import { AgentCommissionsPage } from '../features/agent-commissions';

export const Route = createFileRoute('/agent-commissions/$id')({
  component: () => {
    const { id } = Route.useParams();
    return <AgentCommissionsPage mode="detail" id={id} />;
  },
});
