import type { VehicleType, VehicleTypeResponse, VehicleTypesListResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export function toVehicleType(row: {
  id: number; name: string; code: string; capacityTons: string | null;
  description: string | null; isActive: boolean; createdAt: unknown; updatedAt: unknown;
}): VehicleType {
  return { ...row, createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt) };
}

export const toVehicleTypeResponse = (row: Parameters<typeof toVehicleType>[0]): VehicleTypeResponse =>
  ({ data: toVehicleType(row), message: 'Success' });

export function toVehicleTypesListResponse(rows: Parameters<typeof toVehicleType>[0][], page: number, limit: number, total: number): VehicleTypesListResponse {
  return { data: rows.map(toVehicleType), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
