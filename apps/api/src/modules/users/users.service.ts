import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from '@ems/api-contract';
import { hashPassword } from '../auth/password.utils';
import { toUserResponse, toUsersListResponse } from './users.mapper';
import { UsersRepository, type UpdateUserInput } from './users.repository';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function positiveInt(value: unknown, fieldName: string) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException({
      error: { code: 'INVALID_NUMBER', message: `${fieldName} must be a positive integer` },
    });
  }

  return parsed;
}

function requiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException({
      error: { code: 'REQUIRED_FIELD', message: `${fieldName} is required` },
    });
  }

  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BadRequestException({
      error: { code: 'INVALID_FIELD', message: 'Expected a string value' },
    });
  }

  return value.trim() || null;
}

function booleanValue(value: unknown, fieldName: string) {
  if (typeof value !== 'boolean') {
    throw new BadRequestException({
      error: { code: 'INVALID_BOOLEAN', message: `${fieldName} must be true or false` },
    });
  }

  return value;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUsers(pageValue?: unknown, limitValue?: unknown) {
    const page = pageValue === undefined ? 1 : positiveInt(pageValue, 'page');
    const limit = limitValue === undefined ? 20 : positiveInt(limitValue, 'limit');

    if (limit > 100) {
      throw new BadRequestException({
        error: { code: 'LIMIT_TOO_LARGE', message: 'limit cannot exceed 100' },
      });
    }

    const [users, total] = await Promise.all([
      this.usersRepository.findAll((page - 1) * limit, limit),
      this.usersRepository.countAll(),
    ]);

    return toUsersListResponse(users, page, limit, total);
  }

  async getUserById(userIdValue: unknown) {
    const user = await this.findUser(userIdValue);
    return toUserResponse(user);
  }

  async createUser(body: CreateUserRequest) {
    const name = requiredString(body.name, 'name');
    const email = this.parseEmail(body.email);
    const password = requiredString(body.password, 'password');
    const roleId = positiveInt(body.roleId, 'roleId');

    if (password.length < 8) {
      throw new BadRequestException({
        error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters' },
      });
    }

    await this.assertEmailAvailable(email);
    await this.assertRoleExists(roleId);

    const user = await this.usersRepository.create({
      name,
      email,
      phone: optionalString(body.phone),
      passwordHash: await hashPassword(password),
      roleId,
      isActive: body.isActive === undefined ? true : booleanValue(body.isActive, 'isActive'),
    });

    if (!user) {
      throw new BadRequestException({
        error: { code: 'USER_CREATE_FAILED', message: 'User could not be created' },
      });
    }

    return toUserResponse(user);
  }

  async updateUser(userIdValue: unknown, body: UpdateUserRequest) {
    const existing = await this.findUser(userIdValue);
    const patch: UpdateUserInput = {};

    if (body.name !== undefined) patch.name = requiredString(body.name, 'name');
    if (body.phone !== undefined) patch.phone = optionalString(body.phone);
    if (body.email !== undefined) {
      const email = this.parseEmail(body.email);
      if (email !== existing.email) await this.assertEmailAvailable(email);
      patch.email = email;
    }
    if (body.roleId !== undefined) {
      const roleId = positiveInt(body.roleId, 'roleId');
      await this.assertRoleExists(roleId);
      patch.roleId = roleId;
    }
    if (body.password !== undefined) {
      const password = requiredString(body.password, 'password');
      if (password.length < 8) {
        throw new BadRequestException({
          error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters' },
        });
      }
      patch.passwordHash = await hashPassword(password);
    }
    if (body.isActive !== undefined) patch.isActive = booleanValue(body.isActive, 'isActive');

    const user = await this.usersRepository.update(existing.id, patch);

    if (!user) throw this.userNotFound();
    return toUserResponse(user);
  }

  async updateUserStatus(userIdValue: unknown, body: UpdateUserStatusRequest) {
    const existing = await this.findUser(userIdValue);
    const user = await this.usersRepository.update(existing.id, {
      isActive: booleanValue(body.isActive, 'isActive'),
    });

    if (!user) throw this.userNotFound();
    return toUserResponse(user);
  }

  private async findUser(userIdValue: unknown) {
    const user = await this.usersRepository.findById(positiveInt(userIdValue, 'userId'));
    if (!user) throw this.userNotFound();
    return user;
  }

  private userNotFound() {
    return new NotFoundException({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }

  private parseEmail(value: unknown) {
    const email = requiredString(value, 'email').toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new BadRequestException({
        error: { code: 'INVALID_EMAIL', message: 'Email is invalid' },
      });
    }
    return email;
  }

  private async assertEmailAvailable(email: string) {
    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException({
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'A user with this email already exists' },
      });
    }
  }

  private async assertRoleExists(roleId: number) {
    if (!(await this.usersRepository.findRoleById(roleId))) {
      throw new BadRequestException({
        error: { code: 'ROLE_NOT_FOUND', message: 'Role does not exist' },
      });
    }
  }

}
