import { toIso } from '../../common/utils/master-data.utils';

export type AgentCommissionRow = {
  id: number;
  commissionNumber: string;
  bookingId: number;
  bookingNumber: string;
  agentId: number;
  agentName: string;
  commissionType: string;
  commissionValue: string | null;
  commissionAmount: string;
  status: string;
  payableAfter: string;
  approvedAt: unknown | null;
  approvedByUserId: number | null;
  paidAt: unknown | null;
  paidByUserId: number | null;
  cancelledReason: string | null;
  notes: string | null;
  createdByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type AgentCommission = ReturnType<typeof toAgentCommission>;
export type AgentCommissionResponse = { data: AgentCommission; message: string };
export type AgentCommissionsListResponse = { data: AgentCommission[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

export function toAgentCommission(row: AgentCommissionRow) {
  return {
    id: row.id,
    commissionNumber: row.commissionNumber,
    booking: { id: row.bookingId, bookingNumber: row.bookingNumber },
    agent: { id: row.agentId, name: row.agentName },
    commissionType: row.commissionType,
    commissionValue: row.commissionValue,
    commissionAmount: row.commissionAmount,
    status: row.status,
    payableAfter: row.payableAfter,
    approvedAt: row.approvedAt === null ? null : toIso(row.approvedAt),
    approvedByUserId: row.approvedByUserId,
    paidAt: row.paidAt === null ? null : toIso(row.paidAt),
    paidByUserId: row.paidByUserId,
    cancelledReason: row.cancelledReason,
    notes: row.notes,
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toAgentCommissionResponse = (row: AgentCommissionRow): AgentCommissionResponse => ({ data: toAgentCommission(row), message: 'Success' });

export function toAgentCommissionsListResponse(rows: AgentCommissionRow[], page: number, limit: number, total: number): AgentCommissionsListResponse {
  return { data: rows.map(toAgentCommission), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
