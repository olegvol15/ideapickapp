'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ValidationReport } from '@/components/validate/ValidationReport';
import { useAuth } from '@/context/auth';
import { useGetValidation, UUID_RE } from '@/hooks/use-validations';
import { useRevalidation } from '@/hooks/use-revalidation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ValidationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useGetValidation(user?.id, id);
  const { latestResult, latestDescription } =
    useRevalidation(id, data?.product_type ?? '');

  useEffect(() => {
    if (!user && UUID_RE.test(id)) {
      router.replace('/auth');
    }
  }, [user, id, router]);

  const current = data
    ? {
        result: latestResult?.result ?? data.result_json,
        competitors: latestResult?.competitors ?? data.competitors_json,
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

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8">
      <ValidationReport result={current.result} competitors={current.competitors} />
    </main>
  );
}
