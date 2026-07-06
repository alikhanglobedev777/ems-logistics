import type { TripEvent } from '@ems/api-client';
import { EmptyState, StatusBadge, getStatusTone } from '@ems/ui';

export function TripTimeline({ events }: { events: TripEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Timeline empty"
        message="Trip events will appear here once dispatch activity begins."
        compact
      />
    );
  }

  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id} className="timeline-item">
          <div className="timeline-marker" aria-hidden="true" />
          <div className="timeline-card">
            <div className="timeline-card-top">
              <div>
                <strong>{event.title}</strong>
                <p>{event.description ?? event.station?.name ?? 'Operations event recorded'}</p>
              </div>
              <StatusBadge label={event.eventType.replaceAll('_', ' ')} tone={getStatusTone(event.eventType)} />
            </div>
            <div className="timeline-meta">
              <span>{formatDateTime(event.createdAt)}</span>
              {event.station?.name ? <span>{event.station.name}</span> : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Pending';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
