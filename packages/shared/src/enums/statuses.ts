export const BookingStatus = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  POD_UPLOADED: 'pod_uploaded',
  INVOICED: 'invoiced',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const TripStatus = {
  PLANNED: 'planned',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export const TripLegStatus = {
  PLANNED: 'planned',
  DISPATCHED: 'dispatched',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TripLegStatus = (typeof TripLegStatus)[keyof typeof TripLegStatus];

export const VehicleStatus = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  IN_TRANSIT: 'in_transit',
  MAINTENANCE: 'maintenance',
  BREAKDOWN: 'breakdown',
  INACTIVE: 'inactive',
} as const;

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const DriverAssignmentType = {
  PRIMARY: 'primary',
  TEMPORARY: 'temporary',
} as const;

export type DriverAssignmentType =
  (typeof DriverAssignmentType)[keyof typeof DriverAssignmentType];

export const CustomerType = {
  CONTRACTED: 'contracted',
  SPOT: 'spot',
} as const;

export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CommissionType = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
  MANUAL: 'manual',
} as const;

export type CommissionType = (typeof CommissionType)[keyof typeof CommissionType];

export const FuelSlipStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  INVOICED: 'invoiced',
  PAID: 'paid',
} as const;

export type FuelSlipStatus = (typeof FuelSlipStatus)[keyof typeof FuelSlipStatus];


export const DriverAdvanceStatus = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
} as const;

export type DriverAdvanceStatus = (typeof DriverAdvanceStatus)[keyof typeof DriverAdvanceStatus];

export const DriverExpenseStatus = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DriverExpenseStatus = (typeof DriverExpenseStatus)[keyof typeof DriverExpenseStatus];

export const DriverSettlementStatus = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
} as const;

export type DriverSettlementStatus =
  (typeof DriverSettlementStatus)[keyof typeof DriverSettlementStatus];

export const RoadCondition = {
  GOOD: 'good',
  NORMAL: 'normal',
  ROUGH: 'rough',
  HIGH_RISK: 'high_risk',
} as const;

export type RoadCondition = (typeof RoadCondition)[keyof typeof RoadCondition];

export const FuelType = {
  DIESEL: 'diesel',
  PETROL: 'petrol',
} as const;

export type FuelType = (typeof FuelType)[keyof typeof FuelType];

export const FuelPriceSource = {
  MANUAL: 'manual',
  API: 'api',
} as const;

export type FuelPriceSource = (typeof FuelPriceSource)[keyof typeof FuelPriceSource];


export const ContractRateModel = {
  FIXED: 'fixed',
  FUEL_LINKED: 'fuel_linked',
} as const;

export type ContractRateModel = (typeof ContractRateModel)[keyof typeof ContractRateModel];

export const ContractStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const DeliveryGoodsCondition = {
  GOOD: 'good',
  DAMAGED: 'damaged',
  PARTIAL_DAMAGE: 'partial_damage',
  SHORT_QUANTITY: 'short_quantity',
} as const;

export type DeliveryGoodsCondition =
  (typeof DeliveryGoodsCondition)[keyof typeof DeliveryGoodsCondition];

export const CustomerInvoiceStatus = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type CustomerInvoiceStatus =
  (typeof CustomerInvoiceStatus)[keyof typeof CustomerInvoiceStatus];

export const PaymentMethod = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  MOBILE_WALLET: 'mobile_wallet',
  ADJUSTMENT: 'adjustment',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const AgentCommissionStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type AgentCommissionStatus =
  (typeof AgentCommissionStatus)[keyof typeof AgentCommissionStatus];

export const FuelVendorInvoiceStatus = {
  OPEN: 'open',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type FuelVendorInvoiceStatus =
  (typeof FuelVendorInvoiceStatus)[keyof typeof FuelVendorInvoiceStatus];
