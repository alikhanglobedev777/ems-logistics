import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export type FuelVendorPayment = { id: number; paymentNumber: string; invoice: { id: number; invoiceNumber: string }; vendor: { id: number; name: string }; amount: string; paymentDate: string; paymentMethod: string; referenceNumber: string | null; notes: string | null; paidByUserId: number | null; createdAt: string; updatedAt: string };
type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetFuelVendorPayments() { return useQuery({ queryKey: ['fuel-vendor-payments'], queryFn: () => customHttpClient<ApiResult<ListResponse<FuelVendorPayment>>>('/fuel-vendor-payments?page=1&limit=50') }); }
export function useGetFuelVendorPaymentById(id: number, enabled: boolean) { return useQuery({ queryKey: ['fuel-vendor-payments', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<FuelVendorPayment>>>(`/fuel-vendor-payments/${id}`) }); }
export function usePayFuelVendorInvoice() { return useMutation({ mutationFn: ({ invoiceId, data }: { invoiceId: number; data: Record<string, unknown> }) => customHttpClient<ApiResult<ItemResponse<FuelVendorPayment>>>(`/fuel-vendor-invoices/${invoiceId}/payments`, { method: 'POST', body: JSON.stringify(data) }) }); }
