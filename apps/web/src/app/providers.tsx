import { configureApiClient } from '@ems/api-client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { queryClient } from './query-client';

configureApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
