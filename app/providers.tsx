'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { AIProvider } from '@/contexts/AIContext';
import { ErrorBoundary } from '@/features/errors/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    const handleOnlineStatusChange = () => {
      if (navigator.onLine) {
        queryClient.resumePausedMutations();
        queryClient.invalidateQueries();
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineProvider>
            <RealtimeProvider>
              <AIProvider>
                {children}
                {process.env.NODE_ENV === 'development' && (
                  <ReactQueryDevtools initialIsOpen={false} position="bottom" />
                )}
              </AIProvider>
            </RealtimeProvider>
          </OfflineProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}