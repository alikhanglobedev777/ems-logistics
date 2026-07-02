import type { components } from './generated-types';

type Schemas = components['schemas'];

export type AuthRegisterRequest = Schemas['AuthRegisterRequest'];
export type AuthLoginRequest = Schemas['AuthLoginRequest'];
export type RefreshTokenRequest = Schemas['RefreshTokenRequest'];
export type CurrentUser = Schemas['CurrentUser'];
export type AuthResponse = Schemas['AuthResponse'];
export type MeResponse = Schemas['MeResponse'];

export type CreateUserRequest = Schemas['CreateUserRequest'];
export type UpdateUserRequest = Schemas['UpdateUserRequest'];
export type UpdateUserStatusRequest = Schemas['UpdateUserStatusRequest'];
export type User = Schemas['User'];
export type UserResponse = Schemas['UserResponse'];
export type UsersListResponse = Schemas['UsersListResponse'];

export type CreateRoleRequest = Schemas['CreateRoleRequest'];
export type UpdateRoleRequest = Schemas['UpdateRoleRequest'];
export type Role = Schemas['Role'];
export type RoleResponse = Schemas['RoleResponse'];
export type RolesListResponse = Schemas['RolesListResponse'];

export type Permission = Schemas['Permission'];
export type PermissionsListResponse = Schemas['PermissionsListResponse'];

export type CreateCityRequest = Schemas['CreateCityRequest'];
export type City = Schemas['City'];
export type CityResponse = Schemas['CityResponse'];
export type CitiesListResponse = Schemas['CitiesListResponse'];

export type CreateStationRequest = Schemas['CreateStationRequest'];
export type UpdateStationRequest = Schemas['UpdateStationRequest'];
export type Station = Schemas['Station'];
export type StationResponse = Schemas['StationResponse'];
export type StationsListResponse = Schemas['StationsListResponse'];

export type Pagination = Schemas['Pagination'];
export type SuccessResponse = Schemas['SuccessResponse'];
export type ErrorResponse = Schemas['ErrorResponse'];

export type VehicleStatus = Schemas['VehicleStatus'];
export type VehicleType = Schemas['VehicleType'];
export type CreateVehicleTypeRequest = Schemas['CreateVehicleTypeRequest'];
export type UpdateVehicleTypeRequest = Schemas['UpdateVehicleTypeRequest'];
export type VehicleTypeResponse = Schemas['VehicleTypeResponse'];
export type VehicleTypesListResponse = Schemas['VehicleTypesListResponse'];

export type Vehicle = Schemas['Vehicle'];
export type CreateVehicleRequest = Schemas['CreateVehicleRequest'];
export type UpdateVehicleRequest = Schemas['UpdateVehicleRequest'];
export type VehicleResponse = Schemas['VehicleResponse'];
export type VehiclesListResponse = Schemas['VehiclesListResponse'];

export type Driver = Schemas['Driver'];
export type CreateDriverRequest = Schemas['CreateDriverRequest'];
export type UpdateDriverRequest = Schemas['UpdateDriverRequest'];
export type DriverResponse = Schemas['DriverResponse'];
export type DriversListResponse = Schemas['DriversListResponse'];

export type DriverAssignmentType = Schemas['DriverAssignmentType'];
export type DriverVehicleAssignment = Schemas['DriverVehicleAssignment'];
export type CreateDriverVehicleAssignmentRequest = Schemas['CreateDriverVehicleAssignmentRequest'];
export type UpdateDriverVehicleAssignmentRequest = Schemas['UpdateDriverVehicleAssignmentRequest'];
export type DriverVehicleAssignmentResponse = Schemas['DriverVehicleAssignmentResponse'];
export type DriverVehicleAssignmentsListResponse = Schemas['DriverVehicleAssignmentsListResponse'];

export type CustomerType = Schemas['CustomerType'];
export type Customer = Schemas['Customer'];
export type CreateCustomerRequest = Schemas['CreateCustomerRequest'];
export type UpdateCustomerRequest = Schemas['UpdateCustomerRequest'];
export type CustomerResponse = Schemas['CustomerResponse'];
export type CustomersListResponse = Schemas['CustomersListResponse'];

export type CommissionType = Schemas['CommissionType'];
export type Agent = Schemas['Agent'];
export type CreateAgentRequest = Schemas['CreateAgentRequest'];
export type UpdateAgentRequest = Schemas['UpdateAgentRequest'];
export type AgentResponse = Schemas['AgentResponse'];
export type AgentsListResponse = Schemas['AgentsListResponse'];
