import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRouteRequest, UpdateRouteRequest } from '@ems/api-contract';
import { RoadCondition } from '@ems/shared';
import {
  booleanOrDefault,
  optionalBoolean,
  optionalDecimal,
  optionalPositiveInt,
  optionalString,
  pagination,
  positiveInt,
  requiredString,
} from '../../common/utils/master-data.utils';
import { toRouteResponse, toRoutesListResponse } from './routes.mapper';
import { RoutesRepository } from './routes.repository';

const ROAD_CONDITIONS = new Set<string>(Object.values(RoadCondition));

@Injectable()
export class RoutesService {
  constructor(private readonly repo: RoutesRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      stationId: optionalPositiveInt(query.stationId, 'stationId'),
      isActive: optionalBoolean(query.isActive, 'isActive'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);

    return toRoutesListResponse(rows, p.page, p.limit, total);
  }

  async get(routeIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(routeIdValue, 'routeId'));
    if (!row) throw this.notFound();
    return toRouteResponse(row);
  }

  async create(body: CreateRouteRequest) {
    const originStationId = positiveInt(body.originStationId, 'originStationId');
    const destinationStationId = positiveInt(body.destinationStationId, 'destinationStationId');
    await this.assertStations(originStationId, destinationStationId);

    const duplicate = await this.repo.findByStations(originStationId, destinationStationId);
    if (duplicate) {
      throw new ConflictException({
        error: { code: 'ROUTE_EXISTS', message: 'A route already exists for these stations' },
      });
    }

    const row = await this.repo.create({
      originStationId,
      destinationStationId,
      name: requiredString(body.name, 'name'),
      distanceKm: optionalDecimal(body.distanceKm, 'distanceKm'),
      estimatedDurationHours: optionalDecimal(body.estimatedDurationHours, 'estimatedDurationHours'),
      roadCondition: this.parseRoadCondition(body.roadCondition),
      isActive: booleanOrDefault(body.isActive),
    });

    if (!row) throw new BadRequestException({ error: { code: 'CREATE_FAILED', message: 'Route could not be created' } });
    return toRouteResponse(row);
  }

  async update(routeIdValue: unknown, body: UpdateRouteRequest) {
    const routeId = positiveInt(routeIdValue, 'routeId');
    const existing = await this.repo.findById(routeId);
    if (!existing) throw this.notFound();

    const originStationId =
      body.originStationId === undefined ? undefined : positiveInt(body.originStationId, 'originStationId');
    const destinationStationId =
      body.destinationStationId === undefined
        ? undefined
        : positiveInt(body.destinationStationId, 'destinationStationId');

    if (originStationId !== undefined || destinationStationId !== undefined) {
      await this.assertStations(
        originStationId ?? existing.originStationId,
        destinationStationId ?? existing.destinationStationId,
      );
    }

    const row = await this.repo.update(routeId, {
      originStationId,
      destinationStationId,
      name: body.name === undefined ? undefined : requiredString(body.name, 'name'),
      distanceKm: body.distanceKm === undefined ? undefined : optionalDecimal(body.distanceKm, 'distanceKm'),
      estimatedDurationHours:
        body.estimatedDurationHours === undefined
          ? undefined
          : optionalDecimal(body.estimatedDurationHours, 'estimatedDurationHours'),
      roadCondition: body.roadCondition === undefined ? undefined : this.parseRoadCondition(body.roadCondition),
      isActive: optionalBoolean(body.isActive, 'isActive'),
    });

    return toRouteResponse(row!);
  }

  async remove(routeIdValue: unknown) {
    const routeId = positiveInt(routeIdValue, 'routeId');
    if (!(await this.repo.findById(routeId))) throw this.notFound();
    return toRouteResponse((await this.repo.update(routeId, { isActive: false }))!);
  }

  private async assertStations(originStationId: number, destinationStationId: number) {
    if (originStationId === destinationStationId) {
      throw new BadRequestException({
        error: { code: 'INVALID_ROUTE', message: 'Origin and destination stations must be different' },
      });
    }

    const [origin, destination] = await Promise.all([
      this.repo.stationExists(originStationId),
      this.repo.stationExists(destinationStationId),
    ]);

    if (!origin || !destination) {
      throw new BadRequestException({
        error: { code: 'STATION_NOT_FOUND', message: 'Origin or destination station does not exist' },
      });
    }
  }

  private parseRoadCondition(value: unknown) {
    const condition = value === undefined ? RoadCondition.NORMAL : requiredString(value, 'roadCondition');
    if (!ROAD_CONDITIONS.has(condition)) {
      throw new BadRequestException({
        error: { code: 'INVALID_ROAD_CONDITION', message: 'roadCondition is invalid' },
      });
    }
    return condition;
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
  }
}
