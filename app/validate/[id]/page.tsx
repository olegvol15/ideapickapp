'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ValidationReport } from '@/components/validate/ValidationReport';
import { useAuth } from '@/context/auth';
import { useGetValidation, UUID_RE } from '@/hooks/use-validations';
import { useRevalidation } from '@/hooks/use-revalidation';
import { isPainEvidenceResult } from '@/lib/validate/legacy';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ValidationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useGetValidation(user?.id, id);
  const { handleRevalidate, isRevalidating, latestResult, latestDescription } =
    useRevalidation(id, data?.product_type ?? '');

  useEffect(() => {
    if (!user && UUID_RE.test(id)) {
      router.replace('/auth');
    }
  }, [user, id, router]);

  const current = data
    ? {
        result: latestResult?.result ?? data.result_json,
        description: latestDescription ?? data.description,
      }
    : null;

  if (!isLoading && !current) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-14 sm:px-8">
        <p className="text-muted-foreground text-sm">Validation not found.</p>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-14 sm:px-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  if (!isPainEvidenceResult(current.result)) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-4 px-5 pb-24 pt-14 text-center sm:px-8">
        <p className="text-sm font-semibold text-foreground">
          This validation was created with an older report format.
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Run it again to regenerate it as a pain-evidence report built from
          real complaints found online.
        </p>
        <Button
          size="sm"
          onClick={() => handleRevalidate(current.description)}
          disabled={isRevalidating}
        >
          {isRevalidating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isRevalidating ? 'Validating…' : 'Run again'}
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8">
      <ValidationReport result={current.result} title={current.description} />
    </main>
  );
}
