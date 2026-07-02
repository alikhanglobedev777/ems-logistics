import { Permission } from './permissions';

export type SidebarItem = {
  label: string;
  path: string;
  permission?: Permission;
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Stations', path: '/stations', permission: Permission.STATION_VIEW },
  { label: 'Vehicles', path: '/vehicles', permission: Permission.VEHICLE_VIEW },
  { label: 'Drivers', path: '/drivers', permission: Permission.DRIVER_VIEW },
  { label: 'Customers', path: '/customers', permission: Permission.CUSTOMER_VIEW },
  { label: 'Bookings / Bilty', path: '/bookings', permission: Permission.BOOKING_VIEW },
  { label: 'Trips', path: '/trips', permission: Permission.TRIP_VIEW },
  { label: 'Fuel', path: '/fuel', permission: Permission.FUEL_VIEW },
  { label: 'Reports', path: '/reports', permission: Permission.REPORT_VIEW },
];
