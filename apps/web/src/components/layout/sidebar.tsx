import { Link } from '@tanstack/react-router';

export type SidebarNavItem = {
  label: string;
  path: string;
  accent?: string;
};

export function Sidebar({
  items,
  userLabel,
}: {
  items: SidebarNavItem[];
  userLabel?: string;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">EMS</div>
        <div>
          <strong>Logistics</strong>
          <span>Command Center</span>
        </div>
      </div>

      <div className="sidebar-section-label">Navigation</div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link
            key={item.path}
            to={item.path as never}
            className="sidebar-link"
            activeProps={{ className: 'sidebar-link active' }}
            activeOptions={{ exact: item.path === '/' }}
          >
            <span className="sidebar-link-mark" aria-hidden="true">
              {item.label.slice(0, 2).toUpperCase()}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-section-label">Workspace</div>
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-card-header">
            <span className="sidebar-footer-avatar">{(userLabel ?? 'O').slice(0, 1).toUpperCase()}</span>
            <strong>{userLabel ?? 'Operations Desk'}</strong>
          </div>
          <span>Dispatch, finance, fleet, stations, and master records.</span>
        </div>
      </div>
    </aside>
  );
}
