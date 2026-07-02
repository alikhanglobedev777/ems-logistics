import { Test, TestingModule } from '@nestjs/testing';
import { StationsRepository } from './stations.repository';
import { StationsService } from './stations.service';

describe('StationsService', () => {
  let service: StationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        {
          provide: StationsRepository,
          useValue: {
            cityExists: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
