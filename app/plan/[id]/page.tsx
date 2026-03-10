'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Idea } from '@/types';
import { getPlan } from '@/services/storage.service';
import { computeOpportunityScore } from '@/lib/scoring';
import { RoadmapMap } from '@/components/roadmap/roadmap-map';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
export default function PlanPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const idea = useMemo<Idea | null>(() => getPlan(id), [id]);

  if (!idea) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Plan not found — go back and try again.</p>
          <button
            onClick={() => router.push('/')}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-75 transition-opacity"
          >
            ← Back to IdeaPick
          </button>
        </div>
      </div>
    );
  }

  const score = computeOpportunityScore(idea);

  return (
    <main className="min-h-screen bg-background text-foreground">

      <header className="sticky top-0 z-20 border-b border-border bg-background-frosted px-6 py-3 flex items-center gap-4 backdrop-blur-sm">
        <Button
          onClick={() => router.back()}
          className="text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">
            Build Roadmap
          </p>
          <h1 className="text-sm font-bold text-foreground truncate">{idea.title}</h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{idea.difficulty}</span>
          <span className="text-[10px] font-bold text-muted-foreground/60">
            <span className="text-sm text-foreground">{score}</span>/10
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-6">
        <p className="text-sm leading-relaxed text-foreground/70 max-w-xl">{idea.pitch}</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-8">
        <RoadmapMap idea={idea} />
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {idea.techStack?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
              Suggested Stack
            </p>
            <div className="space-y-2">
              {idea.techStack.map((item) => (
                <div key={item.layer} className="flex items-baseline gap-2">
                  <span className="w-[72px] shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {item.layer}
                  </span>
                  <span className="text-xs text-foreground">{item.tech}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {idea.firstUsers?.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
              Find First Users
            </p>
            <ul className="space-y-2">
              {idea.firstUsers.map((u) => (
                <li key={u} className="flex items-start gap-2 text-xs leading-snug text-foreground/70">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-primary opacity-50" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
            Why This Wins
          </p>
          <p className="text-xs leading-relaxed text-foreground/70">{idea.differentiation}</p>
          {idea.closestCompetitors?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                Watch out for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {idea.closestCompetitors.map((c) => (
                  <span key={c} className="rounded border border-border px-2 py-0.5 text-[9px] text-muted-foreground">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
