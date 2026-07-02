import { BadRequestException } from '@nestjs/common';

export function positiveInt(value: unknown, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException({
      error: { code: 'INVALID_NUMBER', message: `${fieldName} must be a positive integer` },
    });
  }
  return parsed;
}

export function optionalPositiveInt(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;
  return positiveInt(value, fieldName);
}

export function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      error: { code: 'REQUIRED_FIELD', message: `${fieldName} is required` },
    });
  }
  return value.trim();
}

export function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException({
      error: { code: 'INVALID_FIELD', message: 'Expected a string value' },
    });
  }
  return value.trim() || null;
}

export function optionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestException({
    error: { code: 'INVALID_BOOLEAN', message: `${fieldName} must be true or false` },
  });
}

export function booleanOrDefault(value: unknown, fallback = true) {
  return value === undefined ? fallback : optionalBoolean(value, 'isActive') ?? fallback;
}

export function optionalDate(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException({
      error: { code: 'INVALID_DATE', message: `${fieldName} must use YYYY-MM-DD` },
    });
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException({
      error: { code: 'INVALID_DATE', message: `${fieldName} is invalid` },
    });
  }
  return value;
}

export function optionalDecimal(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestException({
      error: { code: 'INVALID_DECIMAL', message: `${fieldName} must be zero or greater` },
    });
  }
  return String(parsed);
}

export function pagination(pageValue?: unknown, limitValue?: unknown) {
  const page = pageValue === undefined ? 1 : positiveInt(pageValue, 'page');
  const limit = limitValue === undefined ? 20 : positiveInt(limitValue, 'limit');
  if (limit > 100) {
    throw new BadRequestException({
      error: { code: 'LIMIT_TOO_LARGE', message: 'limit cannot exceed 100' },
    });
  }
  return { page, limit, offset: (page - 1) * limit };
}

export function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function toDateOnly(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}
