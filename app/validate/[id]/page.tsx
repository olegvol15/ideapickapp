'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ValidationReport } from '@/components/validate/ValidationReport';
import { RefinePanel } from '@/components/validate/RefinePanel';
import { useValidateStore } from '@/stores/validate.store';
import { getValidation, updateValidation } from '@/services/db.service';
import { validateIdeaStream } from '@/services/validate.service';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ValidationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<EnhancedValidationResult | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [version, setVersion] = useState(1);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const updateLocalValidation = useValidateStore((s) => s.updateLocalValidation);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function load() {
      if (UUID_RE.test(id)) {
        if (!user) { router.replace('/auth'); return; }
        const row = await getValidation(user.id, id);
        if (!row) { setNotFound(true); return; }
        setResult(row.result_json);
        setCompetitors(row.competitors_json);
        setDescription(row.description);
        setProductType(row.product_type ?? '');
      } else {
        const entry = useValidateStore.getState().localValidations.find((v) => v.id === id);
        if (!entry) { setNotFound(true); return; }
        setResult(entry.result);
        setCompetitors(entry.competitors);
        setDescription(entry.description);
        setProductType(entry.productType);
      }
    }
    load();
    return () => { abortRef.current?.abort(); };
  }, [id, user, router]);

  async function handleRevalidate(newDescription: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRevalidating(true);

    try {
      const data = await validateIdeaStream(
        { description: newDescription, productType },
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;

      setResult(data.result);
      setCompetitors(data.competitors);
      setDescription(newDescription);
      setVersion((v) => v + 1);

      updateLocalValidation(id, {
        description: newDescription,
        result: data.result,
        competitors: data.competitors,
      });

      if (user && UUID_RE.test(id)) {
        updateValidation(user.id, id, newDescription, data.result, data.competitors)
          .catch(() => { toast.error('Failed to update validation.'); });
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      toast.error((err as { message?: string }).message ?? 'Re-validation failed.');
    } finally {
      setIsRevalidating(false);
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-14 sm:px-8">
        <p className="text-muted-foreground text-sm">Validation not found.</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-14 sm:px-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8">
      <ValidationReport result={result} competitors={competitors} />
      <RefinePanel
        description={description}
        result={result}
        version={version}
        isLoading={isRevalidating}
        onRevalidate={handleRevalidate}
      />
    </main>
  );
}
