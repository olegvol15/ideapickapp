'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button variant="outline" size="sm" onClick={onReset}>
          Try again
        </Button>
        <Button size="sm" onClick={() => window.location.reload()}>
          Reload App
        </Button>
      </div>
    </div>
  );
}
