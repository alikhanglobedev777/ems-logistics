import { BadRequestException, ConflictException } from '@nestjs/common';
import { AgentsRepository } from './agents/agents.repository';
import { AgentsService } from './agents/agents.service';
import { CustomersRepository } from './customers/customers.repository';
import { CustomersService } from './customers/customers.service';
import { DriverVehicleAssignmentsRepository } from './driver-vehicle-assignments/driver-vehicle-assignments.repository';
import { DriverVehicleAssignmentsService } from './driver-vehicle-assignments/driver-vehicle-assignments.service';
import { VehiclesRepository } from './vehicles/vehicles.repository';
import { VehiclesService } from './vehicles/vehicles.service';

describe('Master data business rules', () => {
  it('rejects unsupported vehicle status values', async () => {
    const service = new VehiclesService({} as VehiclesRepository);
    await expect(service.list({ status: 'flying' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents a second active primary driver on one vehicle', async () => {
    const repository = {
      driverExists: jest.fn().mockResolvedValue({ id: 1 }),
      vehicleExists: jest.fn().mockResolvedValue({ id: 1 }),
      findActivePrimary: jest.fn().mockResolvedValue({ id: 9 }),
    };
    const service = new DriverVehicleAssignmentsService(
      repository as unknown as DriverVehicleAssignmentsRepository,
    );

    await expect(
      service.create({
        driverId: 1,
        vehicleId: 1,
        assignmentType: 'primary',
        startDate: '2026-07-02',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects percentage commission above 100', async () => {
    const repository = { stationExists: jest.fn() };
    const service = new AgentsService(repository as unknown as AgentsRepository);

    await expect(
      service.create({
        name: 'Agent',
        phone: '03001234567',
        commissionType: 'percentage',
        commissionValue: 101,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported customer types', async () => {
    const service = new CustomersService({} as CustomersRepository);
    await expect(service.list({ customerType: 'vip' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
