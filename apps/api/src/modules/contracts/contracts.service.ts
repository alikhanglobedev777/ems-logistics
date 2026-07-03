import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCustomerContractRequest, UpdateCustomerContractRequest } from '@ems/api-contract';
import { ContractRateModel, ContractStatus } from '@ems/shared';
import {
  booleanOrDefault,
  optionalBoolean,
  optionalDate,
  optionalDecimal,
  optionalPositiveInt,
  optionalString,
  pagination,
  positiveInt,
  requiredString,
  toDateOnly,
} from '../../common/utils/master-data.utils';
import { toCustomerContractResponse, toCustomerContractsListResponse } from './contracts.mapper';
import { ContractsRepository } from './contracts.repository';

const RATE_MODELS = new Set<string>(Object.values(ContractRateModel));
const STATUSES = new Set<string>(Object.values(ContractStatus));

@Injectable()
export class ContractsService {
  constructor(private readonly repo: ContractsRepository) {}

  async list(query: Record<string, unknown>) {
    const p = pagination(query.page, query.limit);
    const filters = {
      search: optionalString(query.search) ?? undefined,
      customerId: optionalPositiveInt(query.customerId, 'customerId'),
      status: query.status === undefined ? undefined : this.parseStatus(query.status),
    };
    const [rows, total] = await Promise.all([
      this.repo.findAll(filters, p.offset, p.limit),
      this.repo.count(filters),
    ]);
    return toCustomerContractsListResponse(rows, p.page, p.limit, total);
  }

  async get(contractIdValue: unknown) {
    const row = await this.repo.findById(positiveInt(contractIdValue, 'contractId'));
    if (!row) throw this.notFound();
    return toCustomerContractResponse(row);
  }

  async create(body: CreateCustomerContractRequest) {
    const customerId = positiveInt(body.customerId, 'customerId');
    await this.assertCustomer(customerId);
    await this.assertUniqueNumber(requiredString(body.contractNumber, 'contractNumber'));

    const startDate = optionalDate(body.startDate, 'startDate')!;
    const endDate = optionalDate(body.endDate, 'endDate')!;
    this.assertDateRange(startDate, endDate);

    const row = await this.repo.create({
      customerId,
      contractNumber: requiredString(body.contractNumber, 'contractNumber'),
      title: requiredString(body.title, 'title'),
      startDate,
      endDate,
      rateModel: this.parseRateModel(body.rateModel),
      fuelAdjustmentEnabled: booleanOrDefault(body.fuelAdjustmentEnabled, false),
      fuelBasePrice: optionalDecimal(body.fuelBasePrice, 'fuelBasePrice'),
      fuelAdjustmentPerLiter: optionalDecimal(body.fuelAdjustmentPerLiter, 'fuelAdjustmentPerLiter'),
      status: body.status === undefined ? ContractStatus.DRAFT : this.parseStatus(body.status),
    });

    return toCustomerContractResponse(row!);
  }

  async update(contractIdValue: unknown, body: UpdateCustomerContractRequest) {
    const contractId = positiveInt(contractIdValue, 'contractId');
    const existing = await this.repo.findById(contractId);
    if (!existing) throw this.notFound();

    const customerId = body.customerId === undefined ? undefined : positiveInt(body.customerId, 'customerId');
    if (customerId !== undefined) await this.assertCustomer(customerId);

    if (body.contractNumber !== undefined && body.contractNumber !== existing.contractNumber) {
      await this.assertUniqueNumber(requiredString(body.contractNumber, 'contractNumber'));
    }

    const startDate = body.startDate === undefined ? undefined : optionalDate(body.startDate, 'startDate')!;
    const endDate = body.endDate === undefined ? undefined : optionalDate(body.endDate, 'endDate')!;
    this.assertDateRange(startDate ?? toDateOnly(existing.startDate)!, endDate ?? toDateOnly(existing.endDate)!);

    const row = await this.repo.update(contractId, {
      customerId,
      contractNumber: body.contractNumber === undefined ? undefined : requiredString(body.contractNumber, 'contractNumber'),
      title: body.title === undefined ? undefined : requiredString(body.title, 'title'),
      startDate,
      endDate,
      rateModel: body.rateModel === undefined ? undefined : this.parseRateModel(body.rateModel),
      fuelAdjustmentEnabled: optionalBoolean(body.fuelAdjustmentEnabled, 'fuelAdjustmentEnabled'),
      fuelBasePrice: body.fuelBasePrice === undefined ? undefined : optionalDecimal(body.fuelBasePrice, 'fuelBasePrice'),
      fuelAdjustmentPerLiter:
        body.fuelAdjustmentPerLiter === undefined
          ? undefined
          : optionalDecimal(body.fuelAdjustmentPerLiter, 'fuelAdjustmentPerLiter'),
      status: body.status === undefined ? undefined : this.parseStatus(body.status),
    });

    return toCustomerContractResponse(row!);
  }

  async activate(contractIdValue: unknown) {
    const contractId = positiveInt(contractIdValue, 'contractId');
    const existing = await this.repo.findById(contractId);
    if (!existing) throw this.notFound();
    this.assertDateRange(toDateOnly(existing.startDate)!, toDateOnly(existing.endDate)!);
    return toCustomerContractResponse((await this.repo.update(contractId, { status: ContractStatus.ACTIVE }))!);
  }

  async cancel(contractIdValue: unknown) {
    const contractId = positiveInt(contractIdValue, 'contractId');
    if (!(await this.repo.findById(contractId))) throw this.notFound();
    return toCustomerContractResponse((await this.repo.update(contractId, { status: ContractStatus.CANCELLED }))!);
  }

  async expire(contractIdValue: unknown) {
    const contractId = positiveInt(contractIdValue, 'contractId');
    if (!(await this.repo.findById(contractId))) throw this.notFound();
    return toCustomerContractResponse((await this.repo.update(contractId, { status: ContractStatus.EXPIRED }))!);
  }

  private parseRateModel(value: unknown) {
    const model = value === undefined ? ContractRateModel.FIXED : requiredString(value, 'rateModel');
    if (!RATE_MODELS.has(model)) {
      throw new BadRequestException({ error: { code: 'INVALID_RATE_MODEL', message: 'rateModel is invalid' } });
    }
    return model;
  }

  private parseStatus(value: unknown) {
    const status = requiredString(value, 'status');
    if (!STATUSES.has(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_CONTRACT_STATUS', message: 'status is invalid' } });
    }
    return status;
  }

  private assertDateRange(startDate: string, endDate: string) {
    if (new Date(`${endDate}T00:00:00Z`) < new Date(`${startDate}T00:00:00Z`)) {
      throw new BadRequestException({ error: { code: 'INVALID_CONTRACT_DATES', message: 'endDate must be on or after startDate' } });
    }
  }

  private async assertCustomer(customerId: number) {
    if (!(await this.repo.customerExists(customerId))) {
      throw new BadRequestException({ error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist' } });
    }
  }

  private async assertUniqueNumber(contractNumber: string) {
    if (await this.repo.findByNumber(contractNumber)) {
      throw new ConflictException({ error: { code: 'CONTRACT_NUMBER_EXISTS', message: 'Contract number already exists' } });
    }
  }

  private notFound() {
    return new NotFoundException({ error: { code: 'CONTRACT_NOT_FOUND', message: 'Customer contract not found' } });
  }
}

