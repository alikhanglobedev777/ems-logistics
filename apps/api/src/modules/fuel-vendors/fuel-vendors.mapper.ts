import type { FuelVendor, FuelVendorResponse, FuelVendorsListResponse } from '@ems/api-contract';
import { toIso } from '../../common/utils/master-data.utils';

export type FuelVendorRow = {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  ntn: string | null;
  paymentTermsDays: number;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

export function toFuelVendor(row: FuelVendorRow): FuelVendor {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contactPerson,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    ntn: row.ntn,
    paymentTermsDays: row.paymentTermsDays,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export const toFuelVendorResponse = (row: FuelVendorRow): FuelVendorResponse => ({ data: toFuelVendor(row), message: 'Success' });

export function toFuelVendorsListResponse(rows: FuelVendorRow[], page: number, limit: number, total: number): FuelVendorsListResponse {
  return { data: rows.map(toFuelVendor), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
