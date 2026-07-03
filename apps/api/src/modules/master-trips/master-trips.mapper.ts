import type {
  MasterTrip,
  MasterTripResponse,
  MasterTripsListResponse,
  TripEvent,
  TripTimelineResponse,
} from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export type MasterTripRow = {
  id: number;
  tripNumber: string;
  vehicleId: number;
  vehicleNumber: string;
  driverId: number;
  driverName: string;
  startStationId: number;
  startStationName: string;
  currentStationId: number;
  currentStationName: string;
  status: string;
  plannedStartAt: unknown | null;
  actualStartAt: unknown | null;
  completedAt: unknown | null;
  createdByUserId: number | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export type TripEventRow = {
  id: number;
  masterTripId: number;
  tripLegId: number | null;
  eventType: string;
  title: string;
  description: string | null;
  stationId: number | null;
  stationName: string | null;
  createdByUserId: number | null;
  createdAt: unknown;
};

export function toMasterTrip(row: MasterTripRow): MasterTrip {
  return {
    id: row.id,
    tripNumber: row.tripNumber,
    vehicle: { id: row.vehicleId, vehicleNumber: row.vehicleNumber },
    driver: { id: row.driverId, name: row.driverName },
    startStation: { id: row.startStationId, name: row.startStationName },
    currentStation: { id: row.currentStationId, name: row.currentStationName },
    status: row.status as MasterTrip['status'],
    plannedStartAt: row.plannedStartAt === null ? null : toIso(row.plannedStartAt),
    actualStartAt: row.actualStartAt === null ? null : toIso(row.actualStartAt),
    completedAt: row.completedAt === null ? null : toIso(row.completedAt),
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toMasterTripResponse = (row: MasterTripRow): MasterTripResponse => ({
  data: toMasterTrip(row),
  message: 'Success',
});

export function toMasterTripsListResponse(rows: MasterTripRow[], page: number, limit: number, total: number): MasterTripsListResponse {
  return { data: rows.map(toMasterTrip), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export function toTripEvent(row: TripEventRow): TripEvent {
  return {
    id: row.id,
    masterTripId: row.masterTripId,
    tripLegId: row.tripLegId,
    eventType: row.eventType,
    title: row.title,
    description: row.description,
    station: row.stationId === null ? null : { id: row.stationId, name: row.stationName ?? '' },
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
  };
}

export const toTripTimelineResponse = (rows: TripEventRow[]): TripTimelineResponse => ({
  data: rows.map(toTripEvent),
  message: 'Success',
});
