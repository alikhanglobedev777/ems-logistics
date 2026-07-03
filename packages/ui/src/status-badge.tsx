export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusBadgeTone }) {
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}
