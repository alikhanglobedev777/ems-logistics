import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRouteFuelProfileRequest, UpdateRouteFuelProfileRequest } from '@ems/api-contract';
import {
  booleanOrDefault,
  optionalBoolean,
  optionalDecimal,
  optionalPositiveInt,
  optionalString,
  pagination,
  positiveInt,
} from '../../common/utils/master-data.utils';
import { toRouteFuelProfileResponse, toRouteFuelProfilesListResponse } from './route-fuel-profiles.mapper';
import { RouteFuelProfilesRepository } from './route-fuel-profiles.repository';

@Injectable()
export class RouteFuelProfilesService {
  constructor(private readonly repo: RouteFuelProfilesRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      routeId: optionalPositiveInt(query.routeId, 'routeId'),
      vehicleTypeId: optionalPositiveInt(query.vehicleTypeId, 'vehicleTypeId'),
      isActive: optionalBoolean(query.isActive, 'isActive'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toRouteFuelProfilesListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'routeFuelProfileId'));
    if (!row) throw this.notFound();
    return toRouteFuelProfileResponse(row);
  }

  async create(body: CreateRouteFuelProfileRequest) {
    const routeId = positiveInt(body.routeId, 'routeId');
    const vehicleTypeId = positiveInt(body.vehicleTypeId, 'vehicleTypeId');
    await this.assertReferences(routeId, vehicleTypeId);
    if (await this.repo.findByRouteAndVehicle(routeId, vehicleTypeId)) {
      throw new ConflictException({
        error: { code: 'ROUTE_FUEL_PROFILE_EXISTS', message: 'Fuel profile already exists for route and vehicle type' },
      });
    }

    const row = await this.repo.create({
      routeId,
      vehicleTypeId,
      expectedLiters: this.requiredDecimal(body.expectedLiters, 'expectedLiters'),
      reserveLiters: optionalDecimal(body.reserveLiters, 'reserveLiters') ?? '0',
      notes: optionalString(body.notes),
      isActive: booleanOrDefault(body.isActive),
    });
    return toRouteFuelProfileResponse(row!);
  }

  async update(idValue: unknown, body: UpdateRouteFuelProfileRequest) {
    const id = positiveInt(idValue, 'routeFuelProfileId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();

    const routeId = body.routeId === undefined ? undefined : positiveInt(body.routeId, 'routeId');
    const vehicleTypeId =
      body.vehicleTypeId === undefined ? undefined : positiveInt(body.vehicleTypeId, 'vehicleTypeId');
    if (routeId !== undefined || vehicleTypeId !== undefined) {
      await this.assertReferences(routeId ?? existing.routeId, vehicleTypeId ?? existing.vehicleTypeId);
    }

    const row = await this.repo.update(id, {
      routeId,
      vehicleTypeId,
      expectedLiters:
        body.expectedLiters === undefined ? undefined : this.requiredDecimal(body.expectedLiters, 'expectedLiters'),
      reserveLiters:
        body.reserveLiters === undefined
          ? undefined
          : optionalDecimal(body.reserveLiters, 'reserveLiters') ?? '0',
      notes: body.notes === undefined ? undefined : optionalString(body.notes),
      isActive: optionalBoolean(body.isActive, 'isActive'),
    });
    return toRouteFuelProfileResponse(row!);
  }

  async remove(idValue: unknown) {
    const id = positiveInt(idValue, 'routeFuelProfileId');
    if (!(await this.repo.findById(id))) throw this.notFound();
    return toRouteFuelProfileResponse((await this.repo.update(id, { isActive: false }))!);
  }

  private requiredDecimal(value: unknown, fieldName: string) {
    const decimal = optionalDecimal(value, fieldName);
    if (decimal === null) {
      throw new BadRequestException({ error: { code: 'REQUIRED_FIELD', message: `${fieldName} is required` } });
    }
    return decimal;
  }

  private async assertReferences(routeId: number, vehicleTypeId: number) {
    const [route, vehicleType] = await Promise.all([
      this.repo.routeExists(routeId),
      this.repo.vehicleTypeExists(vehicleTypeId),
    ]);
    if (!route || !vehicleType) {
      throw new BadRequestException({
        error: { code: 'REFERENCE_NOT_FOUND', message: 'Route or vehicle type does not exist' },
      });
    }
  }

  private notFound() {
    return new NotFoundException({
      error: { code: 'ROUTE_FUEL_PROFILE_NOT_FOUND', message: 'Route fuel profile not found' },
    });
  }
}
