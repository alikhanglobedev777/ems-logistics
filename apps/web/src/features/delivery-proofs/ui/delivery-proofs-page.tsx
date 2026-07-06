import { useNavigate } from '@tanstack/react-router';
import { DeliveryGoodsCondition } from '@ems/shared';
import { z } from 'zod';
import { MasterDataPage, type FormValues } from '../../master-data';
import { useCreateDeliveryProof, useGetDeliveryProofById, useGetDeliveryProofs, type DeliveryProof } from '../api/delivery-proofs.api';

export function DeliveryProofsPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetDeliveryProofs();
  const detail = useGetDeliveryProofById(Number(id ?? 0), Boolean(id));
  const create = useCreateDeliveryProof();
  const rows: DeliveryProof[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item ? {
    bookingId: String(item.booking.id),
    masterTripId: item.masterTrip ? String(item.masterTrip.id) : '',
    tripLegId: item.tripLeg ? String(item.tripLeg.id) : '',
    receiverName: item.receiverName,
    receiverPhone: item.receiverPhone ?? '',
    receiverCnic: item.receiverCnic ?? '',
    goodsCondition: item.goodsCondition,
    remarks: item.remarks ?? '',
    proofImageUrls: item.proofImageUrls.join('\n'),
    deliveredAt: item.deliveredAt.slice(0, 16),
    createdByUserId: item.createdByUserId ? String(item.createdByUserId) : '',
  } : undefined;

  async function submit(values: FormValues) {
    await create.mutateAsync({
      bookingId: Number(values.bookingId),
      masterTripId: values.masterTripId ? Number(values.masterTripId) : null,
      tripLegId: values.tripLegId ? Number(values.tripLegId) : null,
      receiverName: values.receiverName,
      receiverPhone: values.receiverPhone || null,
      receiverCnic: values.receiverCnic || null,
      goodsCondition: values.goodsCondition || DeliveryGoodsCondition.GOOD,
      remarks: values.remarks || null,
      proofImageUrls: values.proofImageUrls ? values.proofImageUrls.split('\n').map((value) => value.trim()).filter(Boolean) : [],
      deliveredAt: values.deliveredAt ? new Date(values.deliveredAt).toISOString() : null,
      createdByUserId: values.createdByUserId ? Number(values.createdByUserId) : null,
    });
    await navigate({ to: '/delivery-proofs' as any });
  }

  return <MasterDataPage
    title="Delivery Proofs / POD"
    resource="delivery-proofs"
    mode={mode === 'edit' ? 'detail' : mode}
    rows={rows}
    detail={item}
    loading={list.isLoading || detail.isLoading}
    columns={[
      { header: 'POD #', render: (row) => row.proofNumber },
      { header: 'Booking', render: (row) => row.booking.bookingNumber },
      { header: 'Receiver', render: (row) => row.receiverName },
      { header: 'Condition', render: (row) => row.goodsCondition },
      { header: 'Delivered', render: (row) => row.deliveredAt.slice(0, 10) },
    ]}
    fields={[
      { name: 'bookingId', label: 'Booking ID', type: 'number' },
      { name: 'masterTripId', label: 'Master trip ID', type: 'number' },
      { name: 'tripLegId', label: 'Trip leg ID', type: 'number' },
      { name: 'receiverName', label: 'Receiver name' },
      { name: 'receiverPhone', label: 'Receiver phone' },
      { name: 'receiverCnic', label: 'Receiver CNIC' },
      { name: 'goodsCondition', label: 'Goods condition', options: Object.values(DeliveryGoodsCondition).map((value) => ({ label: value.replaceAll('_', ' '), value })) },
      { name: 'remarks', label: 'Remarks' },
      { name: 'proofImageUrls', label: 'Proof image URLs, one per line' },
      { name: 'deliveredAt', label: 'Delivered at', type: 'datetime-local' },
      { name: 'createdByUserId', label: 'Created by user ID', type: 'number' },
    ]}
    schema={z.object({
      bookingId: z.string().min(1), masterTripId: z.string().optional().default(''), tripLegId: z.string().optional().default(''), receiverName: z.string().min(1), receiverPhone: z.string().optional().default(''), receiverCnic: z.string().optional().default(''), goodsCondition: z.string().optional().default('good'), remarks: z.string().optional().default(''), proofImageUrls: z.string().optional().default(''), deliveredAt: z.string().optional().default(''), createdByUserId: z.string().optional().default(''),
    })}
    initial={initial}
    onSubmit={submit}
  />;
}
