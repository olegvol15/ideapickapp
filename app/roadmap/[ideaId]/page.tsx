'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { getPlan } from '@/services/storage.service';
import type { Idea } from '@/types';

export default function RoadmapPage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);

  useEffect(() => {
    setIdea(getPlan(ideaId));
  }, [ideaId]);

  if (!idea) {
    return (
      <AppShell>
        <div className="flex h-svh flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-svh flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b border-border/60 px-5 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-4 w-px bg-border/60" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Roadmap
            </p>
            <h1 className="truncate text-sm font-semibold text-foreground">
              {idea.title}
            </h1>
          </div>
          <p className="ml-auto hidden text-xs text-muted-foreground/60 sm:block">
            Click <span className="font-bold text-foreground/60">+</span> on any node to expand
          </p>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <RoadmapCanvas idea={idea} />
        </div>
      </div>
    </AppShell>
  );
}
