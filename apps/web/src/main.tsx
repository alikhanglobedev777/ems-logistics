import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/query-client';
import './styles/globals.css';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">EMS</div>

        <nav className="sidebar-nav">
          <a className="sidebar-link active">Dashboard</a>
          <a className="sidebar-link">Bookings / Bilty</a>
          <a className="sidebar-link">Master Trips</a>
          <a className="sidebar-link">Vehicles</a>
          <a className="sidebar-link">Drivers</a>
          <a className="sidebar-link">Customers</a>
          <a className="sidebar-link">Fuel Management</a>
          <a className="sidebar-link">Invoices</a>
          <a className="sidebar-link">Reports</a>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>EMS Logistics Dashboard</h1>
            <p>Enterprise transport operations, fuel, trips and finance system</p>
          </div>

          <div className="topbar-user">Ali Khan</div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Active Trips</span>
            <strong>24</strong>
          </div>
          <div className="stat-card">
            <span>Available Vehicles</span>
            <strong>18</strong>
          </div>
          <div className="stat-card">
            <span>Pending Bookings</span>
            <strong>12</strong>
          </div>
          <div className="stat-card">
            <span>Fuel Slips Pending</span>
            <strong>9</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Active Trips</h2>
            <button>New Booking</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Trip No</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Station</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MT-0001</td>
                <td>LES-1234</td>
                <td>Imran</td>
                <td>Lahore → Karachi</td>
                <td>Multan</td>
                <td><span className="badge info">In Transit</span></td>
              </tr>
              <tr>
                <td>MT-0002</td>
                <td>LES-7788</td>
                <td>Ahmed</td>
                <td>Karachi → Lahore</td>
                <td>Karachi</td>
                <td><span className="badge warning">Waiting</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);