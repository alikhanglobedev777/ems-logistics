import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateCityRequest } from '@ems/api-contract';
import { toCitiesListResponse, toCityResponse } from './cities.mapper';
import { CitiesRepository } from './cities.repository';

@Injectable()
export class CitiesService {
  constructor(private readonly citiesRepository: CitiesRepository) {}

  async getCities() {
    const cities = await this.citiesRepository.findAll();

    return toCitiesListResponse(cities);
  }

  async createCity(body: CreateCityRequest) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException({
        error: {
          code: 'CITY_NAME_REQUIRED',
          message: 'City name is required',
        },
      });
    }

    const city = await this.citiesRepository.create({
      name: body.name.trim(),
      province: body.province ?? null,
      country: body.country ?? 'Pakistan',
    });

    return toCityResponse(city);
  }
}
