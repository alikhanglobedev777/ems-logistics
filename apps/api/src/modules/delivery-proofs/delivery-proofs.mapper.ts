import { toIso } from '../../common/utils/master-data.utils';

export type DeliveryProofRow = {
  id: number;
  proofNumber: string;
  bookingId: number;
  bookingNumber: string;
  customerName: string;
  masterTripId: number | null;
  tripNumber: string | null;
  tripLegId: number | null;
  routeName: string | null;
  receiverName: string;
  receiverPhone: string | null;
  receiverCnic: string | null;
  goodsCondition: string;
  remarks: string | null;
  proofImageUrls: unknown;
  deliveredAt: unknown;
  createdByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

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

export type DeliveryProofResponse = { data: DeliveryProof; message: string };
export type DeliveryProofsListResponse = { data: DeliveryProof[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

function imageUrls(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function toDeliveryProof(row: DeliveryProofRow): DeliveryProof {
  return {
    id: row.id,
    proofNumber: row.proofNumber,
    booking: { id: row.bookingId, bookingNumber: row.bookingNumber, customerName: row.customerName },
    masterTrip: row.masterTripId === null ? null : { id: row.masterTripId, tripNumber: row.tripNumber ?? '' },
    tripLeg: row.tripLegId === null ? null : { id: row.tripLegId, routeName: row.routeName ?? '' },
    receiverName: row.receiverName,
    receiverPhone: row.receiverPhone,
    receiverCnic: row.receiverCnic,
    goodsCondition: row.goodsCondition,
    remarks: row.remarks,
    proofImageUrls: imageUrls(row.proofImageUrls),
    deliveredAt: toIso(row.deliveredAt),
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toDeliveryProofResponse = (row: DeliveryProofRow): DeliveryProofResponse => ({ data: toDeliveryProof(row), message: 'Success' });

export function toDeliveryProofsListResponse(rows: DeliveryProofRow[], page: number, limit: number, total: number): DeliveryProofsListResponse {
  return { data: rows.map(toDeliveryProof), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
