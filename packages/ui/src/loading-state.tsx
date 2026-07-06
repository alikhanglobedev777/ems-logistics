export function LoadingState({
  title,
  message,
  compact = false,
}: {
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <div className={`loading-state${compact ? ' compact' : ''}`} aria-live="polite">
      <div className="loading-state-spinner" aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}
