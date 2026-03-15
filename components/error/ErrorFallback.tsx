'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  onReset: () => void;
}

export function ErrorFallback({ onReset }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try reloading the app.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Reload App
        </button>
      </div>
    </div>
  );
}
