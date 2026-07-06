import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type AgentCommission = { id: number; commissionNumber: string; booking: { id: number; bookingNumber: string }; agent: { id: number; name: string }; commissionType: string; commissionValue: string | null; commissionAmount: string; status: string; payableAfter: string; approvedAt: string | null; approvedByUserId: number | null; paidAt: string | null; paidByUserId: number | null; cancelledReason: string | null; notes: string | null; createdByUserId: number | null; createdAt: string; updatedAt: string };
type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetAgentCommissions() { return useQuery({ queryKey: ['agent-commissions'], queryFn: () => customHttpClient<ApiResult<ListResponse<AgentCommission>>>('/agent-commissions?page=1&limit=50') }); }
export function useGetAgentCommissionById(id: number, enabled: boolean) { return useQuery({ queryKey: ['agent-commissions', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<AgentCommission>>>(`/agent-commissions/${id}`) }); }
export function useCreateAgentCommission() { return useMutation({ mutationFn: (data: Record<string, unknown>) => customHttpClient<ApiResult<ItemResponse<AgentCommission>>>('/agent-commissions', { method: 'POST', body: JSON.stringify(data) }) }); }
export function useAgentCommissionAction(action: 'approve' | 'pay' | 'cancel') { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data?: Record<string, unknown> }) => customHttpClient<ApiResult<ItemResponse<AgentCommission>>>(`/agent-commissions/${id}/${action}`, { method: 'POST', body: JSON.stringify(data ?? {}) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-commissions'] }) }); }
