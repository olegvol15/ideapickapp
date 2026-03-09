"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";

/**
 * Client-side provider tree.
 *
 * Kept in a dedicated file so RootLayout can remain a pure Server Component
 * while still hosting both QueryClientProvider and ThemeProvider.
 *
 * QueryClient is created inside useState so each request in server-side
 * rendering gets its own instance (prevents cross-request state sharing).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Most data in this app is generated on-demand; keep it fresh.
            staleTime: 0,
            retry: 1,
          },
          mutations: {
            // Never auto-retry AI calls — they are slow and expensive.
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
