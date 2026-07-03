import type {
  RouteOverheadProfile,
  RouteOverheadProfileResponse,
  RouteOverheadProfilesListResponse,
} from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

type RouteOverheadProfileRow = {
  id: number;
  routeId: number;
  routeName: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  maintenanceCost: string;
  tyreCost: string;
  oilServiceCost: string;
  depreciationCost: string;
  insuranceTaxCost: string;
  routeRiskCost: string;
  emptyReturnRiskCost: string;
  workshopReserveCost: string;
  totalOverhead: string;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toRouteOverheadProfile(row: RouteOverheadProfileRow): RouteOverheadProfile {
  return {
    id: row.id,
    route: { id: row.routeId, name: row.routeName },
    vehicleType: { id: row.vehicleTypeId, name: row.vehicleTypeName, code: row.vehicleTypeCode },
    maintenanceCost: row.maintenanceCost,
    tyreCost: row.tyreCost,
    oilServiceCost: row.oilServiceCost,
    depreciationCost: row.depreciationCost,
    insuranceTaxCost: row.insuranceTaxCost,
    routeRiskCost: row.routeRiskCost,
    emptyReturnRiskCost: row.emptyReturnRiskCost,
    workshopReserveCost: row.workshopReserveCost,
    totalOverhead: row.totalOverhead,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toRouteOverheadProfileResponse = (row: RouteOverheadProfileRow): RouteOverheadProfileResponse => ({
  data: toRouteOverheadProfile(row),
  message: 'Success',
});

export function toRouteOverheadProfilesListResponse(
  rows: RouteOverheadProfileRow[],
  page: number,
  limit: number,
  total: number,
): RouteOverheadProfilesListResponse {
  return {
    data: rows.map(toRouteOverheadProfile),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
