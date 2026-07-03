import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '../features/agents';

export const Route = createFileRoute('/agents/$id')({
  component: AgentDetailRoute,
});

function AgentDetailRoute() {
  const { id } = Route.useParams();
  return <AgentsPage mode="detail" id={id} />;
}
