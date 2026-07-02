export const SystemRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATIONS_MANAGER: 'operations_manager',
  STATION_MANAGER: 'station_manager',
  BOOKING_OFFICER: 'booking_officer',
  DISPATCHER: 'dispatcher',
  FINANCE_MANAGER: 'finance_manager',
  FUEL_MANAGER: 'fuel_manager',
  DRIVER: 'driver',
  AGENT: 'agent',
  CUSTOMER: 'customer',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  [SystemRole.SUPER_ADMIN]: 'Super Admin',
  [SystemRole.ADMIN]: 'Admin',
  [SystemRole.OPERATIONS_MANAGER]: 'Operations Manager',
  [SystemRole.STATION_MANAGER]: 'Station Manager',
  [SystemRole.BOOKING_OFFICER]: 'Booking Officer',
  [SystemRole.DISPATCHER]: 'Dispatcher',
  [SystemRole.FINANCE_MANAGER]: 'Finance Manager',
  [SystemRole.FUEL_MANAGER]: 'Fuel Manager',
  [SystemRole.DRIVER]: 'Driver',
  [SystemRole.AGENT]: 'Agent',
  [SystemRole.CUSTOMER]: 'Customer',
};
