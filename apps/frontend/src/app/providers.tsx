/**
 * Root providers component.
 * Wraps the application with React Query's QueryClientProvider.
 * Configure staleTime and retry behaviour here.
 */

'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_STALE_TIME_MS, QUERY_RETRY_COUNT } from '../constants/api.constants';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Application-level providers wrapper.
 * Uses `useState` to ensure each user session gets its own QueryClient
 * (important for SSR correctness in Next.js).
 *
 * @param children - Child components to wrap
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            retry: QUERY_RETRY_COUNT,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
