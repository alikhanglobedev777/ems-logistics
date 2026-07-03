import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '../features/agents';

export const Route = createFileRoute('/agents/$id/edit')({
  component: AgentEditRoute,
});

function AgentEditRoute() {
  const { id } = Route.useParams();
  return <AgentsPage mode="edit" id={id} />;
}
