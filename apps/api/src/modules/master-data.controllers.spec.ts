import { AgentsController } from './agents/agents.controller';
import { AgentsService } from './agents/agents.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { DriversController } from './drivers/drivers.controller';
import { DriversService } from './drivers/drivers.service';
import { DriverVehicleAssignmentsController } from './driver-vehicle-assignments/driver-vehicle-assignments.controller';
import { DriverVehicleAssignmentsService } from './driver-vehicle-assignments/driver-vehicle-assignments.service';
import { VehiclesController } from './vehicles/vehicles.controller';
import { VehiclesService } from './vehicles/vehicles.service';
import { VehicleTypesController } from './vehicle-types/vehicle-types.controller';
import { VehicleTypesService } from './vehicle-types/vehicle-types.service';

describe('Master data controller wiring', () => {
  it.each([
    [VehicleTypesController, VehicleTypesService],
    [VehiclesController, VehiclesService],
    [DriversController, DriversService],
    [DriverVehicleAssignmentsController, DriverVehicleAssignmentsService],
    [CustomersController, CustomersService],
    [AgentsController, AgentsService],
  ])('%p delegates list requests', async (Controller, _Service) => {
    const service = { list: jest.fn().mockResolvedValue({ data: [], pagination: {} }) };
    const controller = new Controller(service as never);
    await controller.list({ page: '1' });
    expect(service.list).toHaveBeenCalledWith({ page: '1' });
  });
});
