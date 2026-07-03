export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'maintenance';

export type StatusMeta = {
  label: string;
  tone: StatusTone;
};

export const STATUS_META: Record<string, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  assigned: { label: 'Assigned', tone: 'info' },
  planned: { label: 'Planned', tone: 'neutral' },
  dispatched: { label: 'Dispatched', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'info' },
  in_transit: { label: 'In Transit', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  delivered: { label: 'Delivered', tone: 'success' },
  pod_uploaded: { label: 'POD Uploaded', tone: 'success' },
  invoiced: { label: 'Invoiced', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  verified: { label: 'Verified', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  available: { label: 'Available', tone: 'success' },
  maintenance: { label: 'Maintenance', tone: 'maintenance' },
  breakdown: { label: 'Breakdown', tone: 'danger' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: status, tone: 'neutral' };
}
