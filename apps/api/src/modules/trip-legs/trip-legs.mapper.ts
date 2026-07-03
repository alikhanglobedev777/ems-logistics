import type { TripLeg, TripLegResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export type TripLegRow = {
  id: number;
  masterTripId: number;
  sequenceNo: number;
  routeId: number;
  routeName: string;
  originStationId: number;
  originStationName: string;
  destinationStationId: number;
  destinationStationName: string;
  plannedDepartureAt: unknown | null;
  actualDepartureAt: unknown | null;
  actualArrivalAt: unknown | null;
  status: string;
  overrideVehicleId: number | null;
  overrideVehicleNumber: string | null;
  overrideDriverId: number | null;
  overrideDriverName: string | null;
  overrideReason: string | null;
  overrideApprovedByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toTripLeg(row: TripLegRow): TripLeg {
  return {
    id: row.id,
    masterTripId: row.masterTripId,
    sequenceNo: row.sequenceNo,
    route: { id: row.routeId, name: row.routeName },
    originStation: { id: row.originStationId, name: row.originStationName },
    destinationStation: { id: row.destinationStationId, name: row.destinationStationName },
    plannedDepartureAt: row.plannedDepartureAt === null ? null : toIso(row.plannedDepartureAt),
    actualDepartureAt: row.actualDepartureAt === null ? null : toIso(row.actualDepartureAt),
    actualArrivalAt: row.actualArrivalAt === null ? null : toIso(row.actualArrivalAt),
    status: row.status as TripLeg['status'],
    overrideVehicle: row.overrideVehicleId === null ? null : { id: row.overrideVehicleId, vehicleNumber: row.overrideVehicleNumber ?? '' },
    overrideDriver: row.overrideDriverId === null ? null : { id: row.overrideDriverId, name: row.overrideDriverName ?? '' },
    overrideReason: row.overrideReason,
    overrideApprovedByUserId: row.overrideApprovedByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toTripLegResponse = (row: TripLegRow): TripLegResponse => ({ data: toTripLeg(row), message: 'Success' });
