"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time - how long data is considered fresh
            staleTime: 5 * 60 * 1000, // 5 minutes
            // GC time - how long unused data stays in cache
            gcTime: 15 * 60 * 1000, // 15 minutes
            // Retry failed requests
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors (client errors)
              const statusCode = (error as { status?: number })?.status;
              if (statusCode && statusCode >= 400 && statusCode < 500) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus only for critical data
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: 'always',
            // Background refetch interval (30 minutes)
            refetchInterval: 30 * 60 * 1000,
          },
          mutations: {
            // Retry failed mutations
            retry: 1,
            // Mutation retry delay
            retryDelay: 2000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev tools only in development */}
      
    </QueryClientProvider>
  );
}

export default QueryProvider;