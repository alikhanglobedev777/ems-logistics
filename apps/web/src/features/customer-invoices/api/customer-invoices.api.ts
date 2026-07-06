import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export type CustomerInvoice = {
  id: number; invoiceNumber: string; booking: { id: number; bookingNumber: string }; customer: { id: number; name: string };
  invoiceDate: string; dueDate: string | null; subtotalAmount: string; taxAmount: string; totalAmount: string; paidAmount: string; balanceAmount: string; status: string; notes: string | null; issuedAt: string | null; createdByUserId: number | null; createdAt: string; updatedAt: string;
};
type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetCustomerInvoices() { return useQuery({ queryKey: ['customer-invoices'], queryFn: () => customHttpClient<ApiResult<ListResponse<CustomerInvoice>>>('/customer-invoices?page=1&limit=50') }); }
export function useGetCustomerInvoiceById(id: number, enabled: boolean) { return useQuery({ queryKey: ['customer-invoices', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<CustomerInvoice>>>(`/customer-invoices/${id}`) }); }
export function useCreateCustomerInvoice() { return useMutation({ mutationFn: (data: Record<string, unknown>) => customHttpClient<ApiResult<ItemResponse<CustomerInvoice>>>('/customer-invoices', { method: 'POST', body: JSON.stringify(data) }) }); }
