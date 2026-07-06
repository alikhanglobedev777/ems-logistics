import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type TopbarSearchItem = {
  label: string;
  path: string;
  hint?: string;
};

export function Topbar({
  title,
  subtitle,
  breadcrumbs,
  userName,
  onSignOut,
  searchItems,
}: {
  title: string;
  subtitle: string;
  breadcrumbs: ReactNode;
  userName: string;
  onSignOut: () => void;
  searchItems: TopbarSearchItem[];
}) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return searchItems.slice(0, 6);

    return searchItems
      .filter((item) => `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchItems, searchValue]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (alertsRef.current && !alertsRef.current.contains(target)) setAlertsOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstResult = searchResults[0];
    if (!firstResult) return;

    setSearchOpen(false);
    await navigate({ to: firstResult.path as never });
  }

  async function handleSearchNavigate(path: string) {
    setSearchOpen(false);
    setSearchValue('');
    await navigate({ to: path as never });
  }

  return (
    <header className="topbar">
      <div className="topbar-context">
        <div className="topbar-breadcrumbs">{breadcrumbs}</div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-search-wrap" ref={searchRef}>
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <span className="sr-only">Search workspace</span>
            <input
              type="search"
              value={searchValue}
              placeholder="Search bookings, trips, drivers, invoices..."
              aria-label="Search workspace"
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setSearchOpen(true);
              }}
            />
          </form>

          {searchOpen ? (
            <div className="topbar-popover topbar-search-results" role="listbox" aria-label="Search results">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className="topbar-search-result"
                    onClick={() => void handleSearchNavigate(item.path)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.hint ?? item.path}</span>
                  </button>
                ))
              ) : (
                <div className="topbar-empty">No matching pages found.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="topbar-menu-wrap" ref={alertsRef}>
          <button
            type="button"
            className="icon-button topbar-alert-button"
            aria-label="Alerts"
            aria-expanded={alertsOpen}
            onClick={() => {
              setAlertsOpen((current) => !current);
              setProfileOpen(false);
            }}
          >
            Alerts
          </button>

          {alertsOpen ? (
            <div className="topbar-popover topbar-alerts-popover">
              <div className="topbar-popover-header">
                <strong>Alerts</strong>
                <span>Workspace updates</span>
              </div>
              <div className="topbar-alert-item">
                <strong>No new alerts</strong>
                <span>Operational notifications will appear here when available.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="topbar-menu-wrap" ref={profileRef}>
          <button
            className="topbar-profile-trigger"
            type="button"
            title={userName}
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((current) => !current);
              setAlertsOpen(false);
            }}
          >
            <span className="topbar-user-mark">{userName.slice(0, 1).toUpperCase()}</span>
          </button>

          {profileOpen ? (
            <div className="topbar-popover topbar-profile-popover">
              <div className="topbar-popover-header">
                <strong>{userName}</strong>
                <span>Signed in</span>
              </div>
              <button className="button button-secondary topbar-signout-button" type="button" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
