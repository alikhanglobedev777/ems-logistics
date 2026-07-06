import { customHttpClient } from '@ems/api-client';
import { useQuery } from '@tanstack/react-query';

export type ReportsDashboard = {
  bookingsCount: number;
  activeTripsCount: number;
  vehicleAvailability: Record<string, number>;
  customerReceivableAmount: string;
  fuelVendorPayableAmount: string;
  agentCommissionPayableAmount: string;
  actualFuelCostAmount: string;
  approvedDriverCashCostAmount: string;
  invoicedRevenueAmount: string;
  estimatedProfitAmount: string;
};
type ApiResult<T> = { data: T; status: number; headers: Headers };
export function useGetReportsDashboard() { return useQuery({ queryKey: ['reports-dashboard'], queryFn: () => customHttpClient<ApiResult<{ data: ReportsDashboard; message: string }>>('/reports/dashboard') }); }
