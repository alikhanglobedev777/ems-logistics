import { Outlet, useLocation } from '@tanstack/react-router';
import { SIDEBAR_ITEMS } from '@ems/shared';
import { AppShell } from '../components/layout/app-shell';
import { Sidebar } from '../components/layout/sidebar';
import { Topbar, type TopbarSearchItem } from '../components/layout/topbar';
import { useAuth } from '../features/auth';

const enabledPaths = new Set([
  '/',
  '/stations',
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
  '/contracts',
  '/contract-rates',
  '/bookings',
  '/trips',
  '/driver-advances',
  '/driver-settlements',
  '/fuel-vendors',
  '/fuel-slips',
  '/fuel-vendor-invoices',
  '/fuel-vendor-payments',
  '/delivery-proofs',
  '/customer-invoices',
  '/customer-payments',
  '/agent-commissions',
  '/reports',
]);

const navItems = SIDEBAR_ITEMS.filter((item) => enabledPaths.has(item.path));
const searchItems: TopbarSearchItem[] = navItems.map((item) => ({
  label: item.label,
  path: item.path,
  hint: getSearchHint(item.path),
}));

export function RootLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const pageContext = getPageContext(location.pathname);

  return (
    <AppShell
      sidebar={<Sidebar items={navItems} userLabel={user?.role ?? 'operations'} />}
      topbar={
        <Topbar
          title={pageContext.title}
          subtitle={pageContext.subtitle}
          breadcrumbs={pageContext.breadcrumbs}
          userName={user?.name ?? 'Operations'}
          onSignOut={signOut}
          searchItems={searchItems}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}

function getSearchHint(path: string) {
  switch (path) {
    case '/':
      return 'Operations overview dashboard';
    case '/bookings':
      return 'Bilty records and booking operations';
    case '/trips':
      return 'Master trip planning and timeline';
    case '/customer-invoices':
      return 'Finance invoice workspace';
    case '/fuel-slips':
      return 'Fuel verification queue';
    case '/vehicles':
      return 'Fleet vehicle records';
    case '/stations':
      return 'Station master records for routes and vehicles';
    default:
      return path.replaceAll('/', ' ').trim();
  }
}

function getPageContext(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'Operations Overview',
      subtitle: 'Fleet, bookings, finance, and dispatch at a glance.',
      breadcrumbs: 'Dashboard',
    };
  }

  const exactMatch = navItems.find((item) => pathname === item.path);
  if (exactMatch) {
    return {
      title: exactMatch.label,
      subtitle: 'Enterprise operations workspace',
      breadcrumbs: `Dashboard / ${exactMatch.label}`,
    };
  }

  const parentMatch = navItems.find((item) => pathname.startsWith(`${item.path}/`));
  if (parentMatch) {
    return {
      title: `${parentMatch.label} Workspace`,
      subtitle: 'Record details, forms, and actions for the selected module.',
      breadcrumbs: `Dashboard / ${parentMatch.label}`,
    };
  }

  return {
    title: 'EMS Logistics',
    subtitle: 'Operations control center',
    breadcrumbs: 'Dashboard',
  };
}
