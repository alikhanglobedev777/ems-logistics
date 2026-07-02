import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthRegisterRequest } from '@ems/api-contract';
import { Test } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const repository = {
    findUserByEmail: jest.fn(),
    findRoleByName: jest.fn(),
    createUserWithSession: jest.fn(),
    createRefreshSession: jest.fn(),
    findRefreshSession: jest.fn(),
    rotateRefreshSession: jest.fn(),
    revokeRefreshSession: jest.fn(),
    findUserById: jest.fn(),
    getUserPermissions: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejects public registration for an elevated role', async () => {
    const malformedRequest = {
      name: 'Admin',
      email: 'admin@ems.local',
      password: 'StrongPass123',
      roleName: 'super_admin',
    };

    await expect(
      service.register(malformedRequest as unknown as AuthRegisterRequest),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects login when the user does not exist', async () => {
    repository.findUserByEmail.mockResolvedValue(undefined);

    await expect(
      service.login({ email: 'missing@ems.local', password: 'StrongPass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
