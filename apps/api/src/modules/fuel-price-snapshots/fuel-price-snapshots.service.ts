import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateFuelPriceSnapshotRequest } from '@ems/api-contract';
import { FuelPriceSource, FuelType } from '@ems/shared';
import { optionalString, pagination, positiveInt } from '../../common/utils/master-data.utils';
import {
  toFuelPriceSnapshotResponse,
  toFuelPriceSnapshotsListResponse,
} from './fuel-price-snapshots.mapper';
import { FuelPriceSnapshotsRepository } from './fuel-price-snapshots.repository';

const FUEL_TYPES = new Set<string>(Object.values(FuelType));
const SOURCES = new Set<string>(Object.values(FuelPriceSource));

@Injectable()
export class FuelPriceSnapshotsService {
  constructor(private readonly repo: FuelPriceSnapshotsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      fuelType: optionalString(query.fuelType) ?? undefined,
      source: optionalString(query.source) ?? undefined,
    };
    if (filters.fuelType) this.assertFuelType(filters.fuelType);
    if (filters.source) this.assertSource(filters.source);

    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);

    return toFuelPriceSnapshotsListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'fuelPriceSnapshotId'));
    if (!row) throw this.notFound();
    return toFuelPriceSnapshotResponse(row);
  }

  async latest(query: Record<string, unknown>) {
    const fuelType = optionalString(query.fuelType) ?? FuelType.DIESEL;
    this.assertFuelType(fuelType);
    const row = await this.repo.findLatest(fuelType);
    if (!row) throw this.notFound('No fuel price snapshot exists for this fuel type');
    return toFuelPriceSnapshotResponse(row);
  }

  async create(body: CreateFuelPriceSnapshotRequest, userId?: number) {
    const fuelType = String(body.fuelType ?? FuelType.DIESEL);
    const source = String(body.source ?? FuelPriceSource.MANUAL);
    this.assertFuelType(fuelType);
    this.assertSource(source);

    const price = Number(body.pricePerLiter);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException({
        error: { code: 'INVALID_PRICE', message: 'pricePerLiter must be zero or greater' },
      });
    }

    const effectiveAt = new Date(body.effectiveAt);
    if (Number.isNaN(effectiveAt.getTime())) {
      throw new BadRequestException({
        error: { code: 'INVALID_DATE', message: 'effectiveAt is invalid' },
      });
    }

    const row = await this.repo.create({
      fuelType,
      pricePerLiter: String(price),
      source,
      effectiveAt,
      createdByUserId: userId ?? null,
    });

    return toFuelPriceSnapshotResponse(row!);
  }

  private assertFuelType(value: string) {
    if (!FUEL_TYPES.has(value)) {
      throw new BadRequestException({ error: { code: 'INVALID_FUEL_TYPE', message: 'fuelType is invalid' } });
    }
  }

  private assertSource(value: string) {
    if (!SOURCES.has(value)) {
      throw new BadRequestException({ error: { code: 'INVALID_SOURCE', message: 'source is invalid' } });
    }
  }

  private notFound(message = 'Fuel price snapshot not found') {
    return new NotFoundException({ error: { code: 'FUEL_PRICE_NOT_FOUND', message } });
  }
}
