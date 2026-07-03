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

export type RoadCondition = Schemas['RoadCondition'];
export type FuelType = Schemas['FuelType'];
export type FuelPriceSource = Schemas['FuelPriceSource'];

export type Route = Schemas['Route'];
export type CreateRouteRequest = Schemas['CreateRouteRequest'];
export type UpdateRouteRequest = Schemas['UpdateRouteRequest'];
export type RouteResponse = Schemas['RouteResponse'];
export type RoutesListResponse = Schemas['RoutesListResponse'];

export type FuelPriceSnapshot = Schemas['FuelPriceSnapshot'];
export type CreateFuelPriceSnapshotRequest = Schemas['CreateFuelPriceSnapshotRequest'];
export type FuelPriceSnapshotResponse = Schemas['FuelPriceSnapshotResponse'];
export type FuelPriceSnapshotsListResponse = Schemas['FuelPriceSnapshotsListResponse'];

export type RouteFuelProfile = Schemas['RouteFuelProfile'];
export type CreateRouteFuelProfileRequest = Schemas['CreateRouteFuelProfileRequest'];
export type UpdateRouteFuelProfileRequest = Schemas['UpdateRouteFuelProfileRequest'];
export type RouteFuelProfileResponse = Schemas['RouteFuelProfileResponse'];
export type RouteFuelProfilesListResponse = Schemas['RouteFuelProfilesListResponse'];

export type RouteOverheadProfile = Schemas['RouteOverheadProfile'];
export type CreateRouteOverheadProfileRequest = Schemas['CreateRouteOverheadProfileRequest'];
export type UpdateRouteOverheadProfileRequest = Schemas['UpdateRouteOverheadProfileRequest'];
export type RouteOverheadProfileResponse = Schemas['RouteOverheadProfileResponse'];
export type RouteOverheadProfilesListResponse = Schemas['RouteOverheadProfilesListResponse'];

export type RouteEstimateResponse = Schemas['RouteEstimateResponse'];
export type CustomerBasic = Schemas['CustomerBasic'];
export type ContractRateModel = Schemas['ContractRateModel'];
export type ContractStatus = Schemas['ContractStatus'];
export type CustomerContract = Schemas['CustomerContract'];
export type CreateCustomerContractRequest = Schemas['CreateCustomerContractRequest'];
export type UpdateCustomerContractRequest = Schemas['UpdateCustomerContractRequest'];
export type CustomerContractResponse = Schemas['CustomerContractResponse'];
export type CustomerContractsListResponse = Schemas['CustomerContractsListResponse'];
export type ContractBasic = Schemas['ContractBasic'];
export type ContractRate = Schemas['ContractRate'];
export type CreateContractRateRequest = Schemas['CreateContractRateRequest'];
export type UpdateContractRateRequest = Schemas['UpdateContractRateRequest'];
export type ContractRateResponse = Schemas['ContractRateResponse'];
export type ContractRatesListResponse = Schemas['ContractRatesListResponse'];
export type BookingStatus = Schemas['BookingStatus'];
export type BookingPricingSource = Schemas['BookingPricingSource'];
export type Booking = Schemas['Booking'];
export type BookingItemRequest = Schemas['BookingItemRequest'];
export type CreateBookingRequest = Schemas['CreateBookingRequest'];
export type UpdateBookingRequest = Schemas['UpdateBookingRequest'];
export type BookingPricingSnapshot = Schemas['BookingPricingSnapshot'];
export type BookingResponse = Schemas['BookingResponse'];
export type BookingsListResponse = Schemas['BookingsListResponse'];
export type BookingPricingSnapshotResponse = Schemas['BookingPricingSnapshotResponse'];
export type ApproveBookingRateRequest = Schemas['ApproveBookingRateRequest'];
export type CancelBookingRequest = Schemas['CancelBookingRequest'];

export type TripStatus = Schemas['TripStatus'];
export type TripLegStatus = Schemas['TripLegStatus'];
export type CreateMasterTripRequest = Schemas['CreateMasterTripRequest'];
export type MasterTrip = Schemas['MasterTrip'];
export type MasterTripResponse = Schemas['MasterTripResponse'];
export type MasterTripsListResponse = Schemas['MasterTripsListResponse'];
export type CreateTripLegRequest = Schemas['CreateTripLegRequest'];
export type TripLeg = Schemas['TripLeg'];
export type TripLegResponse = Schemas['TripLegResponse'];
export type TripLegsListResponse = Schemas['TripLegsListResponse'];
export type AssignBookingToTripLegRequest = Schemas['AssignBookingToTripLegRequest'];
export type EmergencyTripOverrideRequest = Schemas['EmergencyTripOverrideRequest'];
export type TripEvent = Schemas['TripEvent'];
export type TripTimelineResponse = Schemas['TripTimelineResponse'];
