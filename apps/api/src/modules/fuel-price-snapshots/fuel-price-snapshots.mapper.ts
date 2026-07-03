import type {
  FuelPriceSnapshot,
  FuelPriceSnapshotResponse,
  FuelPriceSnapshotsListResponse,
} from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

type FuelPriceSnapshotRow = {
  id: number;
  fuelType: string;
  pricePerLiter: string;
  source: string;
  effectiveAt: unknown;
  createdByUserId: number | null;
  createdAt: unknown;
};

export function toFuelPriceSnapshot(row: FuelPriceSnapshotRow): FuelPriceSnapshot {
  return {
    id: row.id,
    fuelType: row.fuelType as FuelPriceSnapshot['fuelType'],
    pricePerLiter: row.pricePerLiter,
    source: row.source as FuelPriceSnapshot['source'],
    effectiveAt: toIso(row.effectiveAt),
    createdByUserId: row.createdByUserId,
    createdAt: toIso(row.createdAt),
  };
}

export const toFuelPriceSnapshotResponse = (row: FuelPriceSnapshotRow): FuelPriceSnapshotResponse => ({
  data: toFuelPriceSnapshot(row),
  message: 'Success',
});

export function toFuelPriceSnapshotsListResponse(
  rows: FuelPriceSnapshotRow[],
  page: number,
  limit: number,
  total: number,
): FuelPriceSnapshotsListResponse {
  return {
    data: rows.map(toFuelPriceSnapshot),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
