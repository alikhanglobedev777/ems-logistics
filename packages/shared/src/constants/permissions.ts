export const Permission = {
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',

  STATION_CREATE: 'station.create',
  STATION_UPDATE: 'station.update',
  STATION_VIEW: 'station.view',

  VEHICLE_CREATE: 'vehicle.create',
  VEHICLE_UPDATE: 'vehicle.update',
  VEHICLE_VIEW: 'vehicle.view',

  DRIVER_CREATE: 'driver.create',
  DRIVER_UPDATE: 'driver.update',
  DRIVER_VIEW: 'driver.view',

  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_VIEW: 'customer.view',

  AGENT_CREATE: 'agent.create',
  AGENT_UPDATE: 'agent.update',
  AGENT_VIEW: 'agent.view',

  ROUTE_CREATE: 'route.create',
  ROUTE_UPDATE: 'route.update',
  ROUTE_VIEW: 'route.view',

  FUEL_PRICE_MANAGE: 'fuel_price.manage',
  FUEL_PRICE_VIEW: 'fuel_price.view',
  OVERHEAD_MANAGE: 'overhead.manage',
  OVERHEAD_VIEW: 'overhead.view',

  CONTRACT_CREATE: 'contract.create',
  CONTRACT_UPDATE: 'contract.update',
  CONTRACT_VIEW: 'contract.view',
  CONTRACT_ACTIVATE: 'contract.activate',
  CONTRACT_CANCEL: 'contract.cancel',
  CONTRACT_RATE_CREATE: 'contract_rate.create',
  CONTRACT_RATE_UPDATE: 'contract_rate.update',
  CONTRACT_RATE_VIEW: 'contract_rate.view',

  BOOKING_CREATE: 'booking.create',
  BOOKING_CONFIRM: 'booking.confirm',
  BOOKING_APPROVE_RATE: 'booking.approve_rate',
  BOOKING_CANCEL: 'booking.cancel',
  BOOKING_VIEW: 'booking.view',

  TRIP_CREATE: 'trip.create',
  TRIP_DISPATCH: 'trip.dispatch',
  TRIP_COMPLETE: 'trip.complete',
  TRIP_OVERRIDE_ASSIGNMENT: 'trip.override_assignment',
  TRIP_VIEW: 'trip.view',

  FUEL_VERIFY_SLIP: 'fuel.verify_slip',
  FUEL_MANAGE_VENDOR: 'fuel.manage_vendor',
  FUEL_VIEW: 'fuel.view',

  DRIVER_ADVANCE_CREATE: 'driver_advance.create',
  DRIVER_ADVANCE_ISSUE: 'driver_advance.issue',
  DRIVER_ADVANCE_CANCEL: 'driver_advance.cancel',
  DRIVER_ADVANCE_VIEW: 'driver_advance.view',
  DRIVER_SETTLEMENT_CREATE: 'driver_settlement.create',
  DRIVER_SETTLEMENT_FINALIZE: 'driver_settlement.finalize',
  DRIVER_SETTLEMENT_MARK_PAID: 'driver_settlement.mark_paid',
  DRIVER_SETTLEMENT_CANCEL: 'driver_settlement.cancel',
  DRIVER_SETTLEMENT_VIEW: 'driver_settlement.view',
  DRIVER_EXPENSE_CREATE: 'driver_expense.create',
  DRIVER_EXPENSE_APPROVE: 'driver_expense.approve',

  INVOICE_CREATE: 'invoice.create',
  PAYMENT_RECEIVE: 'payment.receive',

  REPORT_VIEW: 'report.view',
  REPORT_VIEW_PROFIT: 'report.view_profit',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS = Object.values(Permission);
