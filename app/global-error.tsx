'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error renders outside Providers (Next.js requirement) —
// must include its own <html><body> and a local <Toaster>.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    toast.error(error.message || 'Application error');
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-5xl font-bold">500</p>
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="text-sm text-muted-foreground">
            A critical error occurred. Please reload the page.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reload
          </button>
        </div>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
