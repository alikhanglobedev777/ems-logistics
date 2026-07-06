import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export type FuelVendorInvoice = { id: number; invoiceNumber: string; vendor: { id: number; name: string }; vendorInvoiceNumber: string | null; invoiceDate: string; dueDate: string | null; totalAmount: string; paidAmount: string; balanceAmount: string; status: string; notes: string | null; createdByUserId: number | null; createdAt: string; updatedAt: string };
type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetFuelVendorInvoices() { return useQuery({ queryKey: ['fuel-vendor-invoices'], queryFn: () => customHttpClient<ApiResult<ListResponse<FuelVendorInvoice>>>('/fuel-vendor-invoices?page=1&limit=50') }); }
export function useGetFuelVendorInvoiceById(id: number, enabled: boolean) { return useQuery({ queryKey: ['fuel-vendor-invoices', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<FuelVendorInvoice>>>(`/fuel-vendor-invoices/${id}`) }); }
export function useCreateFuelVendorInvoice() { return useMutation({ mutationFn: (data: Record<string, unknown>) => customHttpClient<ApiResult<ItemResponse<FuelVendorInvoice>>>('/fuel-vendor-invoices', { method: 'POST', body: JSON.stringify(data) }) }); }
