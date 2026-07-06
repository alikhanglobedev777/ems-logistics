import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export type CustomerPayment = { id: number; paymentNumber: string; invoice: { id: number; invoiceNumber: string }; customer: { id: number; name: string }; amount: string; paymentDate: string; paymentMethod: string; referenceNumber: string | null; notes: string | null; receivedByUserId: number | null; createdAt: string; updatedAt: string };
type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetCustomerPayments() { return useQuery({ queryKey: ['customer-payments'], queryFn: () => customHttpClient<ApiResult<ListResponse<CustomerPayment>>>('/customer-payments?page=1&limit=50') }); }
export function useGetCustomerPaymentById(id: number, enabled: boolean) { return useQuery({ queryKey: ['customer-payments', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<CustomerPayment>>>(`/customer-payments/${id}`) }); }
export function useReceiveCustomerPayment() { return useMutation({ mutationFn: ({ invoiceId, data }: { invoiceId: number; data: Record<string, unknown> }) => customHttpClient<ApiResult<ItemResponse<CustomerPayment>>>(`/customer-invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }) }); }
