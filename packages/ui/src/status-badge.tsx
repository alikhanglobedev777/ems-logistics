export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'maintenance';

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusBadgeTone }) {
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}

export function getStatusTone(status: string): StatusBadgeTone {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');

  if (['active', 'available', 'completed', 'verified', 'paid', 'approved', 'success'].includes(normalized)) {
    return 'success';
  }

  if (['pending', 'queued', 'planned', 'draft', 'partial', 'partially_paid'].includes(normalized)) {
    return 'warning';
  }

  if (['cancelled', 'rejected', 'overdue', 'failed', 'inactive'].includes(normalized)) {
    return 'danger';
  }

  if (['in_transit', 'confirmed', 'open', 'assigned', 'unpaid'].includes(normalized)) {
    return 'info';
  }

  if (['maintenance'].includes(normalized)) {
    return 'maintenance';
  }

  return 'neutral';
}
