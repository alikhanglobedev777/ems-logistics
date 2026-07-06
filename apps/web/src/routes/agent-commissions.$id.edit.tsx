import { createFileRoute } from '@tanstack/react-router';
import { AgentCommissionsPage } from '../features/agent-commissions';

export const Route = createFileRoute('/agent-commissions/$id/edit')({
  component: () => {
    const { id } = Route.useParams();
    return <AgentCommissionsPage mode="edit" id={id} />;
  },
});
