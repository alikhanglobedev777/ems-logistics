import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateFuelVendorRequest, UpdateFuelVendorRequest } from '@ems/api-contract';
import { booleanOrDefault, optionalBoolean, optionalPositiveInt, optionalString, pagination, positiveInt, requiredString } from '../../common/utils/master-data.utils';
import { toFuelVendorResponse, toFuelVendorsListResponse } from './fuel-vendors.mapper';
import { FuelVendorsRepository } from './fuel-vendors.repository';

@Injectable()
export class FuelVendorsService {
  constructor(private readonly repo: FuelVendorsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = { search: optionalString(query.search) ?? undefined, isActive: optionalBoolean(query.isActive, 'isActive') };
    const [rows, total] = await Promise.all([this.repo.findAll(filters, p.offset, p.limit), this.repo.count(filters)]);
    return toFuelVendorsListResponse(rows, p.page, p.limit, total);
  }

  async get(idValue: unknown) {
    const row = await this.repo.findById(positiveInt(idValue, 'fuelVendorId'));
    if (!row) throw this.notFound();
    return toFuelVendorResponse(row);
  }

  async create(body: CreateFuelVendorRequest) {
    const name = requiredString(body.name, 'name');
    if (await this.repo.findByName(name)) {
      throw new BadRequestException({ error: { code: 'FUEL_VENDOR_EXISTS', message: 'Fuel vendor name already exists' } });
    }
    const row = await this.repo.create({
      name,
      contactPerson: optionalString(body.contactPerson),
      phone: optionalString(body.phone),
      email: optionalString(body.email),
      address: optionalString(body.address),
      city: optionalString(body.city),
      ntn: optionalString(body.ntn),
      paymentTermsDays: optionalPositiveInt(body.paymentTermsDays, 'paymentTermsDays') ?? 0,
      isActive: booleanOrDefault(body.isActive, true),
    });
    return toFuelVendorResponse(row!);
  }

  async update(idValue: unknown, body: UpdateFuelVendorRequest) {
    const id = positiveInt(idValue, 'fuelVendorId');
    const existing = await this.repo.findById(id);
    if (!existing) throw this.notFound();
    const name = body.name === undefined ? undefined : requiredString(body.name, 'name');
    if (name && name !== existing.name && (await this.repo.findByName(name))) {
      throw new BadRequestException({ error: { code: 'FUEL_VENDOR_EXISTS', message: 'Fuel vendor name already exists' } });
    }
    const row = await this.repo.update(id, {
      name,
      contactPerson: body.contactPerson === undefined ? undefined : optionalString(body.contactPerson),
      phone: body.phone === undefined ? undefined : optionalString(body.phone),
      email: body.email === undefined ? undefined : optionalString(body.email),
      address: body.address === undefined ? undefined : optionalString(body.address),
      city: body.city === undefined ? undefined : optionalString(body.city),
      ntn: body.ntn === undefined ? undefined : optionalString(body.ntn),
      paymentTermsDays: body.paymentTermsDays === undefined ? undefined : optionalPositiveInt(body.paymentTermsDays, 'paymentTermsDays') ?? 0,
      isActive: body.isActive === undefined ? undefined : booleanOrDefault(body.isActive, true),
    });
    return toFuelVendorResponse(row!);
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'FUEL_VENDOR_NOT_FOUND', message: 'Fuel vendor not found' } });
  }
}
