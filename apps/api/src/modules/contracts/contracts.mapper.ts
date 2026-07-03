import type { CustomerContract, CustomerContractResponse, CustomerContractsListResponse } from '@ems/api-contract';
import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type CustomerContractRow = {
  id: number;
  customerId: number;
  customerName: string;
  contractNumber: string;
  title: string;
  startDate: unknown;
  endDate: unknown;
  rateModel: string;
  fuelAdjustmentEnabled: boolean;
  fuelBasePrice: string | null;
  fuelAdjustmentPerLiter: string | null;
  status: string;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toCustomerContract(row: CustomerContractRow): CustomerContract {
  return {
    id: row.id,
    customer: { id: row.customerId, name: row.customerName },
    contractNumber: row.contractNumber,
    title: row.title,
    startDate: toDateOnly(row.startDate)!,
    endDate: toDateOnly(row.endDate)!,
    rateModel: row.rateModel as CustomerContract['rateModel'],
    fuelAdjustmentEnabled: row.fuelAdjustmentEnabled,
    fuelBasePrice: row.fuelBasePrice,
    fuelAdjustmentPerLiter: row.fuelAdjustmentPerLiter,
    status: row.status as CustomerContract['status'],
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toCustomerContractResponse = (row: CustomerContractRow): CustomerContractResponse => ({
  data: toCustomerContract(row),
  message: 'Success',
});

export function toCustomerContractsListResponse(
  rows: CustomerContractRow[],
  page: number,
  limit: number,
  total: number,
): CustomerContractsListResponse {
  return {
    data: rows.map(toCustomerContract),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
