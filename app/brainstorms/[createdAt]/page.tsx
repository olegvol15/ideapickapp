'use client';

import { useLayoutEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ResultsTabs } from '@/components/ResultsTabs';
import { loadStorage, HISTORY_KEY, type PersistedResearch } from '@/hooks/use-research';

export default function BrainstormPage() {
  const { createdAt } = useParams<{ createdAt: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<PersistedResearch | null>(null);
  const [notFound, setNotFound] = useState(false);

  useLayoutEffect(() => {
    const id = Number(createdAt);
    const history = loadStorage<PersistedResearch[]>(HISTORY_KEY) ?? [];
    const found = history.find((e) => e.createdAt === id) ?? null;
    if (found) {
      setEntry(found);
    } else {
      setNotFound(true);
    }
  }, [createdAt]);

  if (notFound) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Brainstorm not found.</p>
        <button onClick={() => router.push('/')} className="text-xs text-primary hover:underline">
          ← Go home
        </button>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative mx-auto flex max-w-5xl flex-col gap-8 px-5 pb-20 pt-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
          Brainstorm
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-snug">{entry.prompt}</h1>
        {(entry.productType || entry.difficulty) && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            {[entry.productType, entry.difficulty].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      <ResultsTabs
        result={entry.result}
        visibleCount={entry.result.ideas.length}
        generationId={entry.generationId}
      />
    </main>
  );
}
