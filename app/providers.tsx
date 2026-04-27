'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
}

// QueryClient is created inside useState so each SSR request gets its own
// instance, preventing cross-request state sharing.
export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 0, retry: 1 },
          mutations: { retry: false }, // never auto-retry AI calls — slow and expensive
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
          <ThemedToaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
