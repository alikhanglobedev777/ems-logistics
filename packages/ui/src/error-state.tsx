import type { ReactNode } from 'react';

export function ErrorState({
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
    <div className={`error-state${compact ? ' compact' : ''}`} role="alert">
      <div className="error-state-mark">!</div>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {action ? <div className="error-state-action">{action}</div> : null}
    </div>
  );
}
