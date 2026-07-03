import type { ReactNode } from 'react';

export function StatsCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {icon ? <div className="stat-card-icon">{icon}</div> : null}
    </div>
  );
}
