import type { ReactNode } from 'react';

export function AppShell({
  sidebar,
  topbar,
  children,
}: {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      {sidebar}
      <main className="main-content">
        {topbar}
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
