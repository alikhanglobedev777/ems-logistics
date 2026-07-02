import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    findAll: jest.fn(),
    countAll: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findRoleById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('returns pagination metadata', async () => {
    repository.findAll.mockResolvedValue([]);
    repository.countAll.mockResolvedValue(0);

    await expect(service.getUsers('1', '20')).resolves.toEqual({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('rejects an invalid role id before creating a user', async () => {
    await expect(
      service.createUser({
        name: 'User',
        email: 'user@ems.local',
        password: 'StrongPass123',
        roleId: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
