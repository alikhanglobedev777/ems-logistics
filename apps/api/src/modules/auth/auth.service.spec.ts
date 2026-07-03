import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthRegisterRequest } from '@ems/api-contract';
import { Test } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock };
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
    countUsers: jest.fn(),
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
    jwtService = module.get(JwtService);
  });

  it('rejects public registration for an elevated role after bootstrap exists', async () => {
    repository.countUsers.mockResolvedValue(1);
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

  it('allows the first setup user to register as super_admin', async () => {
    repository.countUsers.mockResolvedValue(0);
    repository.findUserByEmail.mockResolvedValue(undefined);
    repository.findRoleByName.mockResolvedValue({ id: 1, name: 'super_admin', label: 'Super Admin' });
    repository.createUserWithSession.mockResolvedValue({
      id: 1,
      name: 'Admin',
      email: 'admin@ems.local',
      phone: null,
      passwordHash: 'hash',
      isActive: true,
      roleId: 1,
      roleName: 'super_admin',
      roleLabel: 'Super Admin',
    });
    repository.getUserPermissions.mockResolvedValue(['user.manage']);
    jwtService.signAsync.mockResolvedValue('access-token');

    await expect(
      service.register({
        name: 'Admin',
        email: 'admin@ems.local',
        password: 'StrongPass123',
        roleName: 'super_admin',
      } as unknown as AuthRegisterRequest),
    ).resolves.toMatchObject({ data: { accessToken: 'access-token' } });
  });

  it('rejects login when the user does not exist', async () => {
    repository.findUserByEmail.mockResolvedValue(undefined);

    await expect(
      service.login({ email: 'missing@ems.local', password: 'StrongPass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
