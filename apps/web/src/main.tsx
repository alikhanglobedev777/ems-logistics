import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureApiClient } from '@ems/api-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './app/query-client';
import { router } from './router';
import './styles/globals.css';

configureApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);