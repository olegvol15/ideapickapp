'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { getPlan, setPlan, loadRoadmapState } from '@/services/storage.service';
import { useAuth } from '@/context/auth';
import { useGetRoadmap } from '@/hooks/use-roadmaps';
import type { Idea } from '@/types';

export default function RoadmapPage() {
  const { ideaId } = useParams<{ ideaId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Read sessionStorage before first paint
  useLayoutEffect(() => {
    const cached = getPlan(ideaId);
    if (cached) setIdea(cached);
  }, [ideaId]);

  // DB load via React Query (skip when session cache or auth still resolving)
  const { data: dbRoadmap, isFetched: dbFetched } = useGetRoadmap(
    ideaId,
    user?.id,
    {
      enabled: !idea && !authLoading,
    }
  );

  useEffect(() => {
    if (idea || authLoading) return;

    if (!user) {
      setNotFound(true);
      return;
    }

    if (!dbFetched) return;

    if (dbRoadmap) {
      setPlan(dbRoadmap.idea);
      setIdea(dbRoadmap.idea);
    } else {
      setNotFound(true);
    }
  }, [idea, user, authLoading, dbFetched, dbRoadmap]);

  if (notFound) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-sm">Roadmap not found.</p>
        <button
          onClick={() => router.push('/')}
          className="text-xs text-primary hover:underline"
        >
          ← Go home
        </button>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col">
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
          Click <span className="font-bold text-foreground/60">+</span> on any
          node to expand
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <RoadmapCanvas
          idea={idea}
          ideaId={ideaId}
          initialLoading={loadRoadmapState(ideaId) === null}
          userId={user?.id}
          authLoading={authLoading}
        />
      </div>
    </div>
  );
}
