import type { FuelSlip, FuelSlipResponse, FuelSlipsListResponse } from '@ems/api-contract';
import { toDateOnly, toIso } from '../../common/utils/master-data.utils';

export type FuelSlipRow = {
  id: number;
  slipNumber: string;
  fuelVendorId: number;
  fuelVendorName: string;
  masterTripId: number | null;
  tripNumber: string | null;
  tripLegId: number | null;
  routeName: string | null;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  driverId: number;
  driverName: string;
  fuelType: string;
  liters: string;
  pricePerLiter: string;
  totalAmount: string;
  slipDate: unknown;
  odometerReading: string | null;
  stationName: string | null;
  status: string;
  verifiedByUserId: number | null;
  verifiedAt: unknown | null;
  rejectedReason: string | null;
  notes: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toFuelSlip(row: FuelSlipRow): FuelSlip {
  return {
    id: row.id,
    slipNumber: row.slipNumber,
    vendor: { id: row.fuelVendorId, name: row.fuelVendorName },
    masterTrip: row.masterTripId === null ? null : { id: row.masterTripId, tripNumber: row.tripNumber ?? '' },
    tripLeg: row.tripLegId === null ? null : { id: row.tripLegId, routeName: row.routeName ?? '' },
    vehicle: { id: row.vehicleId, registrationNumber: row.vehicleRegistrationNumber },
    driver: { id: row.driverId, name: row.driverName },
    fuelType: row.fuelType as FuelSlip['fuelType'],
    liters: row.liters,
    pricePerLiter: row.pricePerLiter,
    totalAmount: row.totalAmount,
    slipDate: toDateOnly(row.slipDate)!,
    odometerReading: row.odometerReading,
    stationName: row.stationName,
    status: row.status as FuelSlip['status'],
    verifiedByUserId: row.verifiedByUserId,
    verifiedAt: row.verifiedAt === null ? null : toIso(row.verifiedAt),
    rejectedReason: row.rejectedReason,
    notes: row.notes,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toFuelSlipResponse = (row: FuelSlipRow): FuelSlipResponse => ({ data: toFuelSlip(row), message: 'Success' });

export function toFuelSlipsListResponse(rows: FuelSlipRow[], page: number, limit: number, total: number): FuelSlipsListResponse {
  return { data: rows.map(toFuelSlip), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
