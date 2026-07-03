import type { ContractRate, ContractRateResponse, ContractRatesListResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export type ContractRateRow = {
  id: number;
  contractId: number;
  contractNumber: string;
  routeId: number;
  routeName: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  baseFreightRate: string;
  minimumMarginPercent: string;
  loadingCharges: string;
  unloadingCharges: string;
  taxPercent: string;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toContractRate(row: ContractRateRow): ContractRate {
  return {
    id: row.id,
    contract: { id: row.contractId, contractNumber: row.contractNumber },
    route: { id: row.routeId, name: row.routeName },
    vehicleType: { id: row.vehicleTypeId, name: row.vehicleTypeName, code: row.vehicleTypeCode },
    baseFreightRate: row.baseFreightRate,
    minimumMarginPercent: row.minimumMarginPercent,
    loadingCharges: row.loadingCharges,
    unloadingCharges: row.unloadingCharges,
    taxPercent: row.taxPercent,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toContractRateResponse = (row: ContractRateRow): ContractRateResponse => ({
  data: toContractRate(row),
  message: 'Success',
});

export function toContractRatesListResponse(
  rows: ContractRateRow[],
  page: number,
  limit: number,
  total: number,
): ContractRatesListResponse {
  return {
    data: rows.map(toContractRate),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
