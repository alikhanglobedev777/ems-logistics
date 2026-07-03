import type {
  DriverExpense,
  DriverExpenseResponse,
  DriverSettlement,
  DriverSettlementResponse,
  DriverSettlementsListResponse,
} from '@ems/api-contract';
import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type DriverSettlementRow = {
  id: number;
  settlementNumber: string;
  masterTripId: number;
  tripNumber: string;
  driverId: number;
  driverName: string;
  totalAdvanceAmount: string;
  totalApprovedExpenseAmount: string;
  payableToDriverAmount: string;
  recoverableFromDriverAmount: string;
  status: string;
  finalizedAt: unknown | null;
  paidAt: unknown | null;
  cancelledReason: string | null;
  createdByUserId: number | null;
  finalizedByUserId: number | null;
  paidByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type DriverExpenseRow = {
  id: number;
  masterTripId: number;
  tripNumber: string;
  driverId: number;
  driverName: string;
  expenseType: string;
  amount: string;
  description: string | null;
  incurredAt: unknown;
  status: string;
  approvedByUserId: number | null;
  approvedAt: unknown | null;
  rejectReason: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toDriverSettlement(row: DriverSettlementRow): DriverSettlement {
  return {
    id: row.id,
    settlementNumber: row.settlementNumber,
    masterTrip: { id: row.masterTripId, tripNumber: row.tripNumber },
    driver: { id: row.driverId, name: row.driverName },
    totalAdvanceAmount: row.totalAdvanceAmount,
    totalApprovedExpenseAmount: row.totalApprovedExpenseAmount,
    payableToDriverAmount: row.payableToDriverAmount,
    recoverableFromDriverAmount: row.recoverableFromDriverAmount,
    status: row.status as DriverSettlement['status'],
    finalizedAt: row.finalizedAt === null ? null : toIso(row.finalizedAt),
    paidAt: row.paidAt === null ? null : toIso(row.paidAt),
    cancelledReason: row.cancelledReason,
    createdByUserId: row.createdByUserId,
    finalizedByUserId: row.finalizedByUserId,
    paidByUserId: row.paidByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function toDriverExpense(row: DriverExpenseRow): DriverExpense {
  return {
    id: row.id,
    masterTrip: { id: row.masterTripId, tripNumber: row.tripNumber },
    driver: { id: row.driverId, name: row.driverName },
    expenseType: row.expenseType,
    amount: row.amount,
    description: row.description,
    incurredAt: toDateOnly(row.incurredAt)!,
    status: row.status as DriverExpense['status'],
    approvedByUserId: row.approvedByUserId,
    approvedAt: row.approvedAt === null ? null : toIso(row.approvedAt),
    rejectReason: row.rejectReason,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toDriverSettlementResponse = (row: DriverSettlementRow): DriverSettlementResponse => ({
  data: toDriverSettlement(row),
  message: 'Success',
});

export const toDriverExpenseResponse = (row: DriverExpenseRow): DriverExpenseResponse => ({
  data: toDriverExpense(row),
  message: 'Success',
});

export function toDriverSettlementsListResponse(
  rows: DriverSettlementRow[],
  page: number,
  limit: number,
  total: number,
): DriverSettlementsListResponse {
  return {
    data: rows.map(toDriverSettlement),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
