import type { ReactNode } from 'react';

export function EmptyState({
  title,
  message,
  action,
  compact = false,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <div className="empty-state-mark">0</div>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
