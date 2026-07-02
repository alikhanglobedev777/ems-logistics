import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateStationRequest, UpdateStationRequest } from '@ems/api-contract';
import {
  toStationResponse,
  toStationsListResponse,
} from './stations.mapper';
import { StationsRepository } from './stations.repository';

function parsePositiveInt(value: unknown, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException({
      error: {
        code: 'INVALID_NUMBER',
        message: `${fieldName} must be a positive integer`,
      },
    });
  }

  return parsed;
}

function parseOptionalPositiveInt(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;
  return parsePositiveInt(value, fieldName);
}

function parseOptionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;

  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new BadRequestException({
    error: {
      code: 'INVALID_BOOLEAN',
      message: `${fieldName} must be true or false`,
    },
  });
}

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      error: {
        code: 'REQUIRED_FIELD',
        message: `${fieldName} is required`,
      },
    });
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class StationsService {
  constructor(private readonly stationsRepository: StationsRepository) {}

  async getStations(filters: { cityId?: unknown; isActive?: unknown }) {
    const stations = await this.stationsRepository.findAll({
      cityId: parseOptionalPositiveInt(filters.cityId, 'cityId'),
      isActive: parseOptionalBoolean(filters.isActive, 'isActive'),
    });

    return toStationsListResponse(stations);
  }

  async getStationById(stationIdValue: unknown) {
    const stationId = parsePositiveInt(stationIdValue, 'stationId');
    const station = await this.stationsRepository.findById(stationId);

    if (!station) {
      throw new NotFoundException({
        error: {
          code: 'STATION_NOT_FOUND',
          message: 'Station not found',
        },
      });
    }

    return toStationResponse(station);
  }

  async createStation(body: CreateStationRequest) {
    const cityId = parsePositiveInt(body.cityId, 'cityId');
    await this.assertCityExists(cityId);

    const station = await this.stationsRepository.create({
      cityId,
      name: parseRequiredString(body.name, 'name'),
      code: parseOptionalString(body.code),
      address: parseOptionalString(body.address),
      contactPhone: parseOptionalString(body.contactPhone),
    });

    if (!station) {
      throw new BadRequestException({
        error: {
          code: 'STATION_CREATE_FAILED',
          message: 'Station could not be created',
        },
      });
    }

    return toStationResponse(station);
  }

  async updateStation(stationIdValue: unknown, body: UpdateStationRequest) {
    const stationId = parsePositiveInt(stationIdValue, 'stationId');
    const existingStation = await this.stationsRepository.findById(stationId);

    if (!existingStation) {
      throw new NotFoundException({
        error: {
          code: 'STATION_NOT_FOUND',
          message: 'Station not found',
        },
      });
    }

    const cityId = parseOptionalPositiveInt(body.cityId, 'cityId');

    if (cityId) {
      await this.assertCityExists(cityId);
    }

    const station = await this.stationsRepository.update(stationId, {
      cityId,
      name:
        body.name === undefined
          ? undefined
          : parseRequiredString(body.name, 'name'),
      code: body.code === undefined ? undefined : parseOptionalString(body.code),
      address:
        body.address === undefined ? undefined : parseOptionalString(body.address),
      contactPhone:
        body.contactPhone === undefined
          ? undefined
          : parseOptionalString(body.contactPhone),
      isActive: parseOptionalBoolean(body.isActive, 'isActive'),
    });

    if (!station) {
      throw new NotFoundException({
        error: {
          code: 'STATION_NOT_FOUND',
          message: 'Station not found',
        },
      });
    }

    return toStationResponse(station);
  }

  private async assertCityExists(cityId: number) {
    const cityExists = await this.stationsRepository.cityExists(cityId);

    if (!cityExists) {
      throw new BadRequestException({
        error: {
          code: 'CITY_NOT_FOUND',
          message: 'City does not exist',
        },
      });
    }
  }
}
