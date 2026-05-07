'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/auth';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

const ThemedToaster = dynamic(
  () =>
    import('@/components/ui/ThemedToaster').then((m) => ({
      default: m.ThemedToaster,
    })),
  { ssr: false }
);

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
          queries: { staleTime: 5 * 60 * 1000, retry: 1 },
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
