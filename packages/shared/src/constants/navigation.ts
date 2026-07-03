import { Permission } from './permissions.js';

export type SidebarItem = {
  label: string;
  path: string;
  permission?: Permission;
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Stations', path: '/stations', permission: Permission.STATION_VIEW },
  { label: 'Vehicle Types', path: '/vehicle-types', permission: Permission.VEHICLE_VIEW },
  { label: 'Vehicles', path: '/vehicles', permission: Permission.VEHICLE_VIEW },
  { label: 'Drivers', path: '/drivers', permission: Permission.DRIVER_VIEW },
  { label: 'Customers', path: '/customers', permission: Permission.CUSTOMER_VIEW },
  { label: 'Agents', path: '/agents', permission: Permission.AGENT_VIEW },
  { label: 'Routes', path: '/routes', permission: Permission.ROUTE_VIEW },
  { label: 'Fuel Prices', path: '/fuel-prices', permission: Permission.FUEL_PRICE_VIEW },
  { label: 'Route Fuel Profiles', path: '/route-fuel-profiles', permission: Permission.ROUTE_VIEW },
  { label: 'Route Overhead', path: '/route-overhead-profiles', permission: Permission.OVERHEAD_VIEW },
  { label: 'Pricing Estimate', path: '/pricing/route-estimate', permission: Permission.ROUTE_VIEW },
  { label: 'Bookings / Bilty', path: '/bookings', permission: Permission.BOOKING_VIEW },
  { label: 'Trips', path: '/trips', permission: Permission.TRIP_VIEW },
  { label: 'Fuel', path: '/fuel', permission: Permission.FUEL_VIEW },
  { label: 'Reports', path: '/reports', permission: Permission.REPORT_VIEW },
];
