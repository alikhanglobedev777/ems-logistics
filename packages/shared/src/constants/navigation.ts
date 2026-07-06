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
  { label: 'Contracts', path: '/contracts', permission: Permission.CONTRACT_VIEW },
  { label: 'Contract Rates', path: '/contract-rates', permission: Permission.CONTRACT_RATE_VIEW },
  { label: 'Bookings / Bilty', path: '/bookings', permission: Permission.BOOKING_VIEW },
  { label: 'Trips', path: '/trips', permission: Permission.TRIP_VIEW },
  { label: 'Driver Advances', path: '/driver-advances', permission: Permission.DRIVER_ADVANCE_VIEW },
  { label: 'Driver Settlements', path: '/driver-settlements', permission: Permission.DRIVER_SETTLEMENT_VIEW },
  { label: 'Fuel Vendors', path: '/fuel-vendors', permission: Permission.FUEL_MANAGE_VENDOR },
  { label: 'Fuel Slips', path: '/fuel-slips', permission: Permission.FUEL_VIEW },
  { label: 'Fuel Vendor Invoices', path: '/fuel-vendor-invoices', permission: Permission.FUEL_VENDOR_INVOICE_VIEW },
  { label: 'Fuel Vendor Payments', path: '/fuel-vendor-payments', permission: Permission.FUEL_VENDOR_PAYMENT_VIEW },
  { label: 'Delivery Proofs / POD', path: '/delivery-proofs', permission: Permission.DELIVERY_PROOF_VIEW },
  { label: 'Customer Invoices', path: '/customer-invoices', permission: Permission.CUSTOMER_INVOICE_VIEW },
  { label: 'Customer Payments', path: '/customer-payments', permission: Permission.CUSTOMER_PAYMENT_VIEW },
  { label: 'Agent Commissions', path: '/agent-commissions', permission: Permission.AGENT_COMMISSION_VIEW },
  { label: 'Reports', path: '/reports', permission: Permission.REPORT_VIEW },
];
