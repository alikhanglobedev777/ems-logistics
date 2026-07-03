import type { DriverAdvance, DriverAdvanceResponse, DriverAdvancesListResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export type DriverAdvanceRow = {
  id: number;
  advanceNumber: string;
  masterTripId: number;
  tripNumber: string;
  driverId: number;
  driverName: string;
  advanceType: string;
  amount: string;
  paymentMethod: string;
  reason: string | null;
  issuedAt: unknown | null;
  status: string;
  cancelledReason: string | null;
  createdByUserId: number | null;
  issuedByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toDriverAdvance(row: DriverAdvanceRow): DriverAdvance {
  return {
    id: row.id,
    advanceNumber: row.advanceNumber,
    masterTrip: { id: row.masterTripId, tripNumber: row.tripNumber },
    driver: { id: row.driverId, name: row.driverName },
    advanceType: row.advanceType,
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    reason: row.reason,
    issuedAt: row.issuedAt === null ? null : toIso(row.issuedAt),
    status: row.status as DriverAdvance['status'],
    cancelledReason: row.cancelledReason,
    createdByUserId: row.createdByUserId,
    issuedByUserId: row.issuedByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toDriverAdvanceResponse = (row: DriverAdvanceRow): DriverAdvanceResponse => ({
  data: toDriverAdvance(row),
  message: 'Success',
});

export function toDriverAdvancesListResponse(
  rows: DriverAdvanceRow[],
  page: number,
  limit: number,
  total: number,
): DriverAdvancesListResponse {
  return {
    data: rows.map(toDriverAdvance),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
