import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { RouteEstimateResponse } from '@ems/api-contract';
import { FuelType } from '@ems/shared';
import { positiveInt } from '../../common/utils/master-data.utils';
import { toFuelPriceSnapshot } from '../fuel-price-snapshots/fuel-price-snapshots.mapper';
import { toRouteFuelProfile } from '../route-fuel-profiles/route-fuel-profiles.mapper';
import { toRouteOverheadProfile } from '../route-overhead-profiles/route-overhead-profiles.mapper';
import { PricingReadRepository } from './pricing-read.repository';

@Injectable()
export class PricingService {
  constructor(private readonly pricingReadRepository: PricingReadRepository) {}

  async routeEstimate(query: Record<string, unknown>): Promise<RouteEstimateResponse> {
    const routeId = positiveInt(query.routeId, 'routeId');
    const vehicleTypeId = positiveInt(query.vehicleTypeId, 'vehicleTypeId');
    const fuelType = String(query.fuelType ?? FuelType.DIESEL);

    if (!Object.values(FuelType).includes(fuelType as FuelType)) {
      throw new BadRequestException({
        error: { code: 'INVALID_FUEL_TYPE', message: 'fuelType is invalid' },
      });
    }

    const [fuelPrice, fuelProfile, overheadProfile] = await Promise.all([
      this.pricingReadRepository.findLatestFuelPrice(fuelType),
      this.pricingReadRepository.findActiveFuelProfile(routeId, vehicleTypeId),
      this.pricingReadRepository.findActiveOverheadProfile(routeId, vehicleTypeId),
    ]);

    if (!fuelPrice) {
      throw new NotFoundException({
        error: { code: 'FUEL_PRICE_NOT_FOUND', message: 'No active fuel price snapshot found' },
      });
    }
    if (!fuelProfile) {
      throw new NotFoundException({
        error: { code: 'ROUTE_FUEL_PROFILE_NOT_FOUND', message: 'No active route fuel profile found' },
      });
    }
    if (!overheadProfile) {
      throw new NotFoundException({
        error: { code: 'ROUTE_OVERHEAD_PROFILE_NOT_FOUND', message: 'No active route overhead profile found' },
      });
    }

    const expectedLiters = Number(fuelProfile.expectedLiters);
    const reserveLiters = Number(fuelProfile.reserveLiters);
    const pricePerLiter = Number(fuelPrice.pricePerLiter);
    const estimatedFuelCost = (expectedLiters + reserveLiters) * pricePerLiter;
    const internalOverheadCost = Number(overheadProfile.totalOverhead);
    const internalMinimumSuggestedCost = estimatedFuelCost + internalOverheadCost;

    return {
      data: {
        routeId,
        vehicleTypeId,
        fuelPriceSnapshot: toFuelPriceSnapshot(fuelPrice),
        fuelProfile: toRouteFuelProfile(fuelProfile),
        overheadProfile: toRouteOverheadProfile(overheadProfile),
        estimatedFuelCost: estimatedFuelCost.toFixed(2),
        internalOverheadCost: internalOverheadCost.toFixed(2),
        internalMinimumSuggestedCost: internalMinimumSuggestedCost.toFixed(2),
      },
      message: 'Success',
    };
  }
}
