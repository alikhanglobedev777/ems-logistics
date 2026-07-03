import type { Route, RouteResponse, RoutesListResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

type RouteRow = {
  id: number;
  name: string;
  distanceKm: string | null;
  estimatedDurationHours: string | null;
  roadCondition: string;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  originStationId: number;
  originStationName: string;
  originStationCode: string | null;
  destinationStationId: number;
  destinationStationName: string;
  destinationStationCode: string | null;
};

export function toRoute(row: RouteRow): Route {
  return {
    id: row.id,
    name: row.name,
    originStation: { id: row.originStationId, name: row.originStationName, code: row.originStationCode },
    destinationStation: {
      id: row.destinationStationId,
      name: row.destinationStationName,
      code: row.destinationStationCode,
    },
    distanceKm: row.distanceKm,
    estimatedDurationHours: row.estimatedDurationHours,
    roadCondition: row.roadCondition as Route['roadCondition'],
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toRouteResponse = (row: RouteRow): RouteResponse => ({
  data: toRoute(row),
  message: 'Success',
});

export function toRoutesListResponse(
  rows: RouteRow[],
  page: number,
  limit: number,
  total: number,
): RoutesListResponse {
  return {
    data: rows.map(toRoute),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
