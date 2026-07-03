import type {
  Booking,
  BookingPricingSnapshot,
  BookingPricingSnapshotResponse,
  BookingResponse,
  BookingsListResponse,
} from '@ems/api-contract';
import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type BookingRow = {
  id: number;
  bookingNumber: string;
  customerId: number;
  customerName: string;
  contractId: number | null;
  contractNumber: string | null;
  agentId: number | null;
  agentName: string | null;
  originStationId: number;
  originStationName: string;
  destinationStationId: number;
  destinationStationName: string;
  routeId: number | null;
  routeName: string | null;
  requiredVehicleTypeId: number;
  requiredVehicleTypeName: string;
  requiredVehicleTypeCode: string;
  status: string;
  cargoDescription: string;
  cargoWeightTons: string | null;
  quantity: string | null;
  pickupDate: unknown;
  deliveryDueDate: unknown;
  finalFreightRate: string;
  taxAmount: string;
  totalCustomerAmount: string;
  requiresRateApproval: boolean;
  approvedByUserId: number | null;
  approvedAt: unknown;
  cancelReason: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type BookingPricingSnapshotRow = {
  id: number;
  bookingId: number;
  fuelPriceSnapshotId: number | null;
  fuelPricePerLiter: string;
  expectedLiters: string;
  reserveLiters: string;
  estimatedFuelCost: string;
  internalOverheadCost: string;
  agentCommissionEstimate: string;
  suggestedFreightRate: string;
  finalFreightRate: string;
  estimatedMarginAmount: string;
  estimatedMarginPercent: string;
  pricingSource: string;
  createdAt: unknown;
};

export function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    bookingNumber: row.bookingNumber,
    customer: { id: row.customerId, name: row.customerName },
    contract: row.contractId ? { id: row.contractId, contractNumber: row.contractNumber ?? '' } : null,
    agent: row.agentId ? { id: row.agentId, name: row.agentName ?? '' } : null,
    originStation: { id: row.originStationId, name: row.originStationName },
    destinationStation: { id: row.destinationStationId, name: row.destinationStationName },
    route: row.routeId ? { id: row.routeId, name: row.routeName ?? '' } : null,
    requiredVehicleType: {
      id: row.requiredVehicleTypeId,
      name: row.requiredVehicleTypeName,
      code: row.requiredVehicleTypeCode,
    },
    status: row.status as Booking['status'],
    cargoDescription: row.cargoDescription,
    cargoWeightTons: row.cargoWeightTons,
    quantity: row.quantity,
    pickupDate: toDateOnly(row.pickupDate),
    deliveryDueDate: toDateOnly(row.deliveryDueDate),
    finalFreightRate: row.finalFreightRate,
    taxAmount: row.taxAmount,
    totalCustomerAmount: row.totalCustomerAmount,
    requiresRateApproval: row.requiresRateApproval,
    approvedByUserId: row.approvedByUserId,
    approvedAt: row.approvedAt ? toIso(row.approvedAt) : null,
    cancelReason: row.cancelReason,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toBookingPricingSnapshot(row: BookingPricingSnapshotRow): BookingPricingSnapshot {
  return {
    id: row.id,
    bookingId: row.bookingId,
    fuelPriceSnapshotId: row.fuelPriceSnapshotId,
    fuelPricePerLiter: row.fuelPricePerLiter,
    expectedLiters: row.expectedLiters,
    reserveLiters: row.reserveLiters,
    estimatedFuelCost: row.estimatedFuelCost,
    internalOverheadCost: row.internalOverheadCost,
    agentCommissionEstimate: row.agentCommissionEstimate,
    suggestedFreightRate: row.suggestedFreightRate,
    finalFreightRate: row.finalFreightRate,
    estimatedMarginAmount: row.estimatedMarginAmount,
    estimatedMarginPercent: row.estimatedMarginPercent,
    pricingSource: row.pricingSource as BookingPricingSnapshot['pricingSource'],
    createdAt: toIso(row.createdAt),
  };
}

export const toBookingResponse = (row: BookingRow): BookingResponse => ({ data: toBooking(row), message: 'Success' });

export const toBookingPricingSnapshotResponse = (row: BookingPricingSnapshotRow): BookingPricingSnapshotResponse => ({
  data: toBookingPricingSnapshot(row),
  message: 'Success',
});

export function toBookingsListResponse(rows: BookingRow[], page: number, limit: number, total: number): BookingsListResponse {
  return { data: rows.map(toBooking), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
