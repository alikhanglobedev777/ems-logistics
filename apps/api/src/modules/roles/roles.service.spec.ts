import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RolesRepository } from './roles.repository';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  const repository = {
    findAll: jest.fn(),
    countAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findAllPermissions: jest.fn(),
    findPermissionsByKeys: jest.fn(),
    findPermissionsForRoleIds: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesRepository, useValue: repository },
      ],
    }).compile();
    service = module.get(RolesService);
  });

  it('returns an empty paginated role list', async () => {
    repository.findAll.mockResolvedValue([]);
    repository.countAll.mockResolvedValue(0);
    repository.findPermissionsForRoleIds.mockResolvedValue([]);

    await expect(service.getRoles()).resolves.toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('rejects unknown permission keys', async () => {
    repository.findPermissionsByKeys.mockResolvedValue([]);

    await expect(
      service.createRole({
        name: 'custom_role',
        label: 'Custom Role',
        permissionKeys: ['missing.permission'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
