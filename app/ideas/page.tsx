'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OpportunityCard } from '@/components/opportunity/opportunity-card';
import { OpportunityModal } from '@/components/opportunity/opportunity-modal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { getSavedIdeasFromDB, type SavedIdeaRow } from '@/services/db.service';
import type { Idea } from '@/types';

export default function IdeasPage() {
  const { user, loading } = useAuth();
  const [savedIdeas, setSavedIdeas] = useState<SavedIdeaRow[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(
    null
  );
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let cancelled = false;
    const userId = user.id;

    async function loadWorkspace() {
      setPageLoading(true);

      try {
        const savedRows = await getSavedIdeasFromDB(userId);
        if (cancelled) return;
        setSavedIdeas(savedRows);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  function handleUnsave(title: string) {
    setSavedIdeas((prev) =>
      prev.filter((row) => row.idea_json.title !== title)
    );
    if (selectedIdea?.title === title) {
      setSelectedIdea(null);
      setActiveGenerationId(null);
    }
  }

  function openIdea(idea: Idea, generationId?: string | null) {
    setSelectedIdea(idea);
    setActiveGenerationId(generationId ?? null);
  }

  const workspaceLoading = loading || (Boolean(user) && pageLoading);

  return (
    <AppShell>
      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70">
            Workspace
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Saved ideas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the concepts you kept from your brainstorms.
            </p>
          </div>
        </div>

        {workspaceLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card/60">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your workspace...
            </div>
          </div>
        ) : !user ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-card/50 px-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/[0.06] text-primary">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">
                Sign in to keep your ideas
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Saved ideas are tied to your account.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to generator</Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Bookmark
                  className="h-4 w-4 text-primary"
                  fill="currentColor"
                />
                <h2 className="text-sm font-bold text-foreground">
                  Saved Ideas
                </h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {savedIdeas.length}
                </span>
              </div>

              {savedIdeas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-sm text-muted-foreground">
                  Save ideas from the generator and they’ll appear here.
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-3">
                    {savedIdeas.map((row, index) => (
                      <motion.div
                        key={row.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                      >
                        <OpportunityCard
                          {...row.idea_json}
                          generationId={row.generation_id}
                          onExplore={() =>
                            openIdea(row.idea_json, row.generation_id)
                          }
                          onUnsave={() => handleUnsave(row.idea_json.title)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </section>
          </>
        )}
      </main>

      <OpportunityModal
        idea={selectedIdea}
        generationId={activeGenerationId}
        open={Boolean(selectedIdea)}
        onClose={() => setSelectedIdea(null)}
      />
    </AppShell>
  );
}
