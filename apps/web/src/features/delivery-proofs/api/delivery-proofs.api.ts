import { customHttpClient } from '@ems/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export type DeliveryProof = {
  id: number;
  proofNumber: string;
  booking: { id: number; bookingNumber: string; customerName: string };
  masterTrip: { id: number; tripNumber: string } | null;
  tripLeg: { id: number; routeName: string } | null;
  receiverName: string;
  receiverPhone: string | null;
  receiverCnic: string | null;
  goodsCondition: string;
  remarks: string | null;
  proofImageUrls: string[];
  deliveredAt: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
type ItemResponse<T> = { data: T; message: string };

type ApiResult<T> = { data: T; status: number; headers: Headers };

export function useGetDeliveryProofs() {
  return useQuery({ queryKey: ['delivery-proofs'], queryFn: () => customHttpClient<ApiResult<ListResponse<DeliveryProof>>>('/delivery-proofs?page=1&limit=50') });
}

export function useGetDeliveryProofById(id: number, enabled: boolean) {
  return useQuery({ queryKey: ['delivery-proofs', id], enabled, queryFn: () => customHttpClient<ApiResult<ItemResponse<DeliveryProof>>>(`/delivery-proofs/${id}`) });
}

export function useCreateDeliveryProof() {
  return useMutation({ mutationFn: (data: Record<string, unknown>) => customHttpClient<ApiResult<ItemResponse<DeliveryProof>>>('/delivery-proofs', { method: 'POST', body: JSON.stringify(data) }) });
}
