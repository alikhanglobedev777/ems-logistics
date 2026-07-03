import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateContractRateRequest, UpdateContractRateRequest } from '@ems/api-contract';
import {
  booleanOrDefault,
  optionalBoolean,
  optionalDate,
  optionalDecimal,
  optionalPositiveInt,
  pagination,
  positiveInt,
} from '../../common/utils/master-data.utils';
import { toContractRateResponse, toContractRatesListResponse } from './contract-rates.mapper';
import { ContractRatesRepository } from './contract-rates.repository';

@Injectable()
export class ContractRatesService {
  constructor(private readonly repo: ContractRatesRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      contractId: optionalPositiveInt(query.contractId, 'contractId'),
      routeId: optionalPositiveInt(query.routeId, 'routeId'),
      vehicleTypeId: optionalPositiveInt(query.vehicleTypeId, 'vehicleTypeId'),
      isActive: optionalBoolean(query.isActive, 'isActive'),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toContractRatesListResponse(rows, p.page, p.limit, total);
  }

  async get(contractRateIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(contractRateIdValue, 'contractRateId'));
    if (!row) throw this.notFound();
    return toContractRateResponse(row);
  }

  async activeRate(query: Record<string, unknown>) {
    const customerId = positiveInt(query.customerId, 'customerId');
    const routeId = positiveInt(query.routeId, 'routeId');
    const vehicleTypeId = positiveInt(query.vehicleTypeId, 'vehicleTypeId');
    const effectiveDateValue = optionalDate(query.effectiveDate, 'effectiveDate') ?? new Date().toISOString().slice(0, 10);
    const effectiveDate = new Date(`${effectiveDateValue}T00:00:00.000Z`);

    const row = await this.repo.findActiveRate(customerId, routeId, vehicleTypeId, effectiveDate);
    if (!row) {
      throw new NotFoundException({ error: { code: 'ACTIVE_RATE_NOT_FOUND', message: 'Active contract rate not found' } });
    }
    return toContractRateResponse(row);
  }

  async create(body: CreateContractRateRequest) {
    const contractId = positiveInt(body.contractId, 'contractId');
    const routeId = positiveInt(body.routeId, 'routeId');
    const vehicleTypeId = positiveInt(body.vehicleTypeId, 'vehicleTypeId');
    await this.assertReferences(contractId, routeId, vehicleTypeId);
    await this.assertUnique(contractId, routeId, vehicleTypeId);

    const row = await this.repo.create({
      contractId,
      routeId,
      vehicleTypeId,
      baseFreightRate: optionalDecimal(body.baseFreightRate, 'baseFreightRate')!,
      minimumMarginPercent: optionalDecimal(body.minimumMarginPercent, 'minimumMarginPercent') ?? '0',
      loadingCharges: optionalDecimal(body.loadingCharges, 'loadingCharges') ?? '0',
      unloadingCharges: optionalDecimal(body.unloadingCharges, 'unloadingCharges') ?? '0',
      taxPercent: optionalDecimal(body.taxPercent, 'taxPercent') ?? '0',
      isActive: booleanOrDefault(body.isActive),
    });
    return toContractRateResponse(row!);
  }

  async update(contractRateIdValue: unknown, body: UpdateContractRateRequest) {
    const contractRateId = positiveInt(contractRateIdValue, 'contractRateId');
    const existing = await this.repo.findById(contractRateId);
    if (!existing) throw this.notFound();

    const contractId = body.contractId === undefined ? undefined : positiveInt(body.contractId, 'contractId');
    const routeId = body.routeId === undefined ? undefined : positiveInt(body.routeId, 'routeId');
    const vehicleTypeId =
      body.vehicleTypeId === undefined ? undefined : positiveInt(body.vehicleTypeId, 'vehicleTypeId');

    const nextContractId = contractId ?? existing.contractId;
    const nextRouteId = routeId ?? existing.routeId;
    const nextVehicleTypeId = vehicleTypeId ?? existing.vehicleTypeId;

    if (contractId !== undefined || routeId !== undefined || vehicleTypeId !== undefined) {
      await this.assertReferences(nextContractId, nextRouteId, nextVehicleTypeId);
      const duplicate = await this.repo.findDuplicate(nextContractId, nextRouteId, nextVehicleTypeId);
      if (duplicate && duplicate.id !== contractRateId) {
        throw new ConflictException({ error: { code: 'CONTRACT_RATE_EXISTS', message: 'Contract rate already exists' } });
      }
    }

    const row = await this.repo.update(contractRateId, {
      contractId,
      routeId,
      vehicleTypeId,
      baseFreightRate:
        body.baseFreightRate === undefined ? undefined : optionalDecimal(body.baseFreightRate, 'baseFreightRate')!,
      minimumMarginPercent:
        body.minimumMarginPercent === undefined
          ? undefined
          : optionalDecimal(body.minimumMarginPercent, 'minimumMarginPercent') ?? '0',
      loadingCharges: body.loadingCharges === undefined ? undefined : optionalDecimal(body.loadingCharges, 'loadingCharges') ?? '0',
      unloadingCharges:
        body.unloadingCharges === undefined ? undefined : optionalDecimal(body.unloadingCharges, 'unloadingCharges') ?? '0',
      taxPercent: body.taxPercent === undefined ? undefined : optionalDecimal(body.taxPercent, 'taxPercent') ?? '0',
      isActive: optionalBoolean(body.isActive, 'isActive'),
    });
    return toContractRateResponse(row!);
  }

  async remove(contractRateIdValue: unknown) {
    const contractRateId = positiveInt(contractRateIdValue, 'contractRateId');
    if (!(await this.repo.findById(contractRateId))) throw this.notFound();
    return toContractRateResponse((await this.repo.update(contractRateId, { isActive: false }))!);
  }

  private async assertReferences(contractId: number, routeId: number, vehicleTypeId: number) {
    const [contract, route, vehicleType] = await Promise.all([
      this.repo.contractExists(contractId),
      this.repo.routeExists(routeId),
      this.repo.vehicleTypeExists(vehicleTypeId),
    ]);
    if (!contract || !route || !vehicleType) {
      throw new BadRequestException({ error: { code: 'REFERENCE_NOT_FOUND', message: 'Contract, route, or vehicle type does not exist' } });
    }
  }

  private async assertUnique(contractId: number, routeId: number, vehicleTypeId: number) {
    if (await this.repo.findDuplicate(contractId, routeId, vehicleTypeId)) {
      throw new ConflictException({ error: { code: 'CONTRACT_RATE_EXISTS', message: 'Contract rate already exists' } });
    }
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'CONTRACT_RATE_NOT_FOUND', message: 'Contract rate not found' } });
  }
}

