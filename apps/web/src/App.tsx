import { Outlet } from '@tanstack/react-router';

const nav=[['/','Dashboard'],['/vehicle-types','Vehicle Types'],['/vehicles','Vehicles'],['/drivers','Drivers'],['/customers','Customers'],['/agents','Agents']] as const;
export default function App(){return <div className="app-shell"><aside className="sidebar"><div className="sidebar-logo">EMS</div><nav className="sidebar-nav">{nav.map(([to,label])=><a key={to} href={to} className={`sidebar-link ${location.pathname===to?'active':''}`}>{label}</a>)}</nav></aside><main className="main-content"><header className="topbar"><div><strong>EMS Logistics</strong><span>Master data control center</span></div><div className="topbar-user">Operations</div></header><Outlet/></main></div>}
