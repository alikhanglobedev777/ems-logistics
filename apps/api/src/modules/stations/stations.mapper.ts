import type {
  Station,
  StationResponse,
  StationsListResponse,
} from '@ems/api-contract';

export type StationMapperSource = {
  id: number;
  cityId: number;
  cityName: string;
  name: string;
  code: string | null;
  address: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: unknown;
};

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toStation(station: StationMapperSource): Station {
  return {
    id: station.id,
    cityId: station.cityId,
    cityName: station.cityName,
    name: station.name,
    code: station.code,
    address: station.address,
    contactPhone: station.contactPhone,
    isActive: station.isActive,
    createdAt: toIso(station.createdAt),
  };
}

export function toStationResponse(station: StationMapperSource): StationResponse {
  return { data: toStation(station) };
}

export function toStationsListResponse(
  stations: StationMapperSource[],
): StationsListResponse {
  return { data: stations.map(toStation) };
}
