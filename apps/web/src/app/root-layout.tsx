import { Link, Outlet } from '@tanstack/react-router';
import { SIDEBAR_ITEMS } from '@ems/shared';

const enabledPaths = new Set([
  '/',
  '/vehicle-types',
  '/vehicles',
  '/drivers',
  '/customers',
  '/agents',
  '/routes',
  '/fuel-prices',
  '/route-fuel-profiles',
  '/route-overhead-profiles',
  '/pricing/route-estimate',
]);

const navItems = SIDEBAR_ITEMS.filter((item) => enabledPaths.has(item.path));

export function RootLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">EMS</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path as any}
              className="sidebar-link"
              activeProps={{ className: 'sidebar-link active' }}
              activeOptions={{ exact: item.path === '/' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <strong>EMS Logistics</strong>
            <span>Operations control center</span>
          </div>
          <div className="topbar-user">Operations</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
