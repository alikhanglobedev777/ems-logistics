import type {
  RouteFuelProfile,
  RouteFuelProfileResponse,
  RouteFuelProfilesListResponse,
} from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

type RouteFuelProfileRow = {
  id: number;
  routeId: number;
  routeName: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  expectedLiters: string;
  reserveLiters: string;
  notes: string | null;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toRouteFuelProfile(row: RouteFuelProfileRow): RouteFuelProfile {
  return {
    id: row.id,
    route: { id: row.routeId, name: row.routeName },
    vehicleType: { id: row.vehicleTypeId, name: row.vehicleTypeName, code: row.vehicleTypeCode },
    expectedLiters: row.expectedLiters,
    reserveLiters: row.reserveLiters,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toRouteFuelProfileResponse = (row: RouteFuelProfileRow): RouteFuelProfileResponse => ({
  data: toRouteFuelProfile(row),
  message: 'Success',
});

export function toRouteFuelProfilesListResponse(
  rows: RouteFuelProfileRow[],
  page: number,
  limit: number,
  total: number,
): RouteFuelProfilesListResponse {
  return {
    data: rows.map(toRouteFuelProfile),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
