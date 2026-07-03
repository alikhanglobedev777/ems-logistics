import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRouteOverheadProfileRequest, UpdateRouteOverheadProfileRequest } from '@ems/api-contract';
import {
  booleanOrDefault,
  optionalBoolean,
  optionalDecimal,
  optionalPositiveInt,
  pagination,
  positiveInt,
} from '../../common/utils/master-data.utils';
import {
  toRouteOverheadProfileResponse,
  toRouteOverheadProfilesListResponse,
} from './route-overhead-profiles.mapper';
import { RouteOverheadProfilesRepository } from './route-overhead-profiles.repository';

const COST_FIELDS = [
  'maintenanceCost',
  'tyreCost',
  'oilServiceCost',
  'depreciationCost',
  'insuranceTaxCost',
  'routeRiskCost',
  'emptyReturnRiskCost',
  'workshopReserveCost',
] as const;

type CostField = (typeof COST_FIELDS)[number];

@Injectable()
export class RouteOverheadProfilesService {
  constructor(private readonly repo: RouteOverheadProfilesRepository) {}

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
    return toRouteOverheadProfilesListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'routeOverheadProfileId'));
    if (!row) throw this.notFound();
    return toRouteOverheadProfileResponse(row);
  }

  async create(body: CreateRouteOverheadProfileRequest) {
    const routeId = positiveInt(body.routeId, 'routeId');
    const vehicleTypeId = positiveInt(body.vehicleTypeId, 'vehicleTypeId');
    await this.assertReferences(routeId, vehicleTypeId);
    if (await this.repo.findByRouteAndVehicle(routeId, vehicleTypeId)) {
      throw new ConflictException({
        error: { code: 'ROUTE_OVERHEAD_PROFILE_EXISTS', message: 'Overhead profile already exists for route and vehicle type' },
      });
    }

    const costs = this.parseCosts(body);
    const row = await this.repo.create({
      routeId,
      vehicleTypeId,
      ...costs,
      totalOverhead: this.calculateTotal(costs),
      isActive: booleanOrDefault(body.isActive),
    });
    return toRouteOverheadProfileResponse(row!);
  }

  async update(idValue: unknown, body: UpdateRouteOverheadProfileRequest) {
    const id = positiveInt(idValue, 'routeOverheadProfileId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();

    const routeId = body.routeId === undefined ? undefined : positiveInt(body.routeId, 'routeId');
    const vehicleTypeId = body.vehicleTypeId === undefined ? undefined : positiveInt(body.vehicleTypeId, 'vehicleTypeId');
    if (routeId !== undefined || vehicleTypeId !== undefined) {
      await this.assertReferences(routeId ?? existing.routeId, vehicleTypeId ?? existing.vehicleTypeId);
    }

    const mergedCosts = this.parseCosts({
      maintenanceCost: body.maintenanceCost ?? existing.maintenanceCost,
      tyreCost: body.tyreCost ?? existing.tyreCost,
      oilServiceCost: body.oilServiceCost ?? existing.oilServiceCost,
      depreciationCost: body.depreciationCost ?? existing.depreciationCost,
      insuranceTaxCost: body.insuranceTaxCost ?? existing.insuranceTaxCost,
      routeRiskCost: body.routeRiskCost ?? existing.routeRiskCost,
      emptyReturnRiskCost: body.emptyReturnRiskCost ?? existing.emptyReturnRiskCost,
      workshopReserveCost: body.workshopReserveCost ?? existing.workshopReserveCost,
    });

    const row = await this.repo.update(id, {
      routeId,
      vehicleTypeId,
      ...mergedCosts,
      totalOverhead: this.calculateTotal(mergedCosts),
      isActive: optionalBoolean(body.isActive, 'isActive'),
    });
    return toRouteOverheadProfileResponse(row!);
  }

  async remove(idValue: unknown) {
    const id = positiveInt(idValue, 'routeOverheadProfileId');
    if (!(await this.repo.findById(id))) throw this.notFound();
    return toRouteOverheadProfileResponse((await this.repo.update(id, { isActive: false }))!);
  }

  private parseCosts(input: Partial<Record<CostField, unknown>>): Record<CostField, string> {
    const costs = {} as Record<CostField, string>;
    for (const field of COST_FIELDS) {
      costs[field] = optionalDecimal(input[field] ?? 0, field) ?? '0';
    }
    return costs;
  }

  private calculateTotal(costs: Record<CostField, string>) {
    return COST_FIELDS.reduce((sum, field) => sum + Number(costs[field]), 0).toFixed(2);
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
      error: { code: 'ROUTE_OVERHEAD_PROFILE_NOT_FOUND', message: 'Route overhead profile not found' },
    });
  }
}
