import type {
  CitiesListResponse,
  City,
  CityResponse,
} from '@ems/api-contract';

export type CityMapperSource = {
  id: number;
  name: string;
  province: string | null;
  country: string;
  created_at: unknown;
};

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toCity(city: CityMapperSource): City {
  return {
    id: city.id,
    name: city.name,
    province: city.province,
    country: city.country,
    createdAt: toIso(city.created_at),
  };
}

export function toCityResponse(city: CityMapperSource): CityResponse {
  return { data: toCity(city) };
}

export function toCitiesListResponse(cities: CityMapperSource[]): CitiesListResponse {
  return { data: cities.map(toCity) };
}
