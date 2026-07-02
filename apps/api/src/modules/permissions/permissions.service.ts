import { BadRequestException, Injectable } from '@nestjs/common';
import { toPermissionsListResponse } from './permissions.mapper';
import { PermissionsRepository } from './permissions.repository';

function positiveInt(value: unknown, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException({
      error: { code: 'INVALID_NUMBER', message: `${fieldName} must be a positive integer` },
    });
  }
  return parsed;
}

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async getPermissions(pageValue?: unknown, limitValue?: unknown) {
    const page = pageValue === undefined ? 1 : positiveInt(pageValue, 'page');
    const limit = limitValue === undefined ? 100 : positiveInt(limitValue, 'limit');
    if (limit > 200) {
      throw new BadRequestException({
        error: { code: 'LIMIT_TOO_LARGE', message: 'limit cannot exceed 200' },
      });
    }

    const [permissions, total] = await Promise.all([
      this.permissionsRepository.findAll((page - 1) * limit, limit),
      this.permissionsRepository.countAll(),
    ]);

    return toPermissionsListResponse(permissions, page, limit, total);
  }
}
