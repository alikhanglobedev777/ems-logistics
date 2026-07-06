import type { ReactNode } from 'react';

export function StatsCard({
  label,
  value,
  icon,
  helper,
  trend,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: ReactNode;
  trend?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span>{label}</span>
        {icon ? <div className="stat-card-icon">{icon}</div> : null}
      </div>
      <strong>{value}</strong>
      {helper ? <p className="stat-card-helper">{helper}</p> : null}
      {trend ? <div className="stat-card-trend">{trend}</div> : null}
    </div>
  );
}
