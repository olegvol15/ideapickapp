'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ValidationReport } from '@/components/validate/ValidationReport';
import { useValidateStore } from '@/stores/validate.store';
import { getValidation } from '@/services/db.service';
import { useAuth } from '@/context/auth';
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
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (UUID_RE.test(id)) {
        // DB record — requires auth
        if (!user) { router.replace('/auth'); return; }
        const row = await getValidation(user.id, id);
        if (!row) { setNotFound(true); return; }
        setResult(row.result_json);
        setCompetitors(row.competitors_json);
      } else {
        // Local store
        const entry = useValidateStore.getState().localValidations.find((v) => v.id === id);
        if (!entry) { setNotFound(true); return; }
        setResult(entry.result);
        setCompetitors(entry.competitors);
      }
    }
    load();
  }, [id, user, router]);

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
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-14 sm:px-8">
      <ValidationReport result={result} competitors={competitors} />
    </main>
  );
}
