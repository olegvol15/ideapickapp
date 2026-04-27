'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Loader2, Search, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ValidationHistoryCard } from '@/components/validate/ValidationHistoryCard';
import { BrainstormHistoryCard } from '@/components/layout/BrainstormHistoryCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth';
import {
  useGetValidations,
  useDeleteValidation,
  useRenameValidation,
} from '@/hooks/use-validations';
import {
  useGetGenerations,
  useDeleteGeneration,
  useRenameGeneration,
} from '@/hooks/use-generations';
import { useValidateStore } from '@/stores/validate.store';
import { useResearchStore } from '@/stores/research.store';
import { cn } from '@/lib/utils';

type Tab = 'validations' | 'brainstorms';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('validations');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (searchParams.get('tab') === 'brainstorms') setActiveTab('brainstorms');
  }, [searchParams]);

  // Validations data
  const { data: dbValidations, isLoading: validationsLoading } =
    useGetValidations(user?.id);
  const localValidations = useValidateStore((s) => s.localValidations);
  const removeLocalValidation = useValidateStore(
    (s) => s.removeLocalValidation
  );
  const renameLocalValidation = useValidateStore(
    (s) => s.renameLocalValidation
  );
  const deleteValidationMutation = useDeleteValidation(user?.id);
  const renameValidationMutation = useRenameValidation(user?.id);

  // Brainstorms data
  const { data: dbGenerations, isLoading: generationsLoading } =
    useGetGenerations(user?.id);
  const localHistory = useResearchStore((s) => s.localHistory);
  const deleteGenerationMutation = useDeleteGeneration(user?.id);
  const renameGenerationMutation = useRenameGeneration(user?.id);

  const workspaceLoading =
    loading || (Boolean(user) && (validationsLoading || generationsLoading));

  const validations = user
    ? (dbValidations ?? []).map((v) => ({
        id: v.id,
        description: v.description,
        productType: v.product_type,
        result: v.result_json,
        competitors: v.competitors_json,
        createdAt: v.created_at,
      }))
    : localValidations.map((v) => ({
        id: v.id,
        description: v.description,
        productType: v.productType,
        result: v.result,
        competitors: v.competitors,
        createdAt: v.createdAt,
      }));

  const brainstorms = user
    ? (dbGenerations ?? []).map((g) => ({
        id: g.id,
        prompt: g.prompt,
        productType: g.product_type,
        ideasCount: g.result_json.ideas?.length ?? 0,
        createdAt: g.created_at,
      }))
    : localHistory.map((h) => ({
        id: String(h.createdAt),
        prompt: h.prompt,
        productType: h.productType || null,
        ideasCount: h.result.ideas?.length ?? 0,
        createdAt: h.createdAt,
      }));

  const q = query.trim().toLowerCase();
  const filteredValidations = q
    ? validations.filter((v) => v.description.toLowerCase().includes(q))
    : validations;
  const filteredBrainstorms = q
    ? brainstorms.filter((b) => b.prompt.toLowerCase().includes(q))
    : brainstorms;

  function handleDeleteValidation(id: string) {
    removeLocalValidation(id);
    if (user) deleteValidationMutation.mutate(id);
  }

  function handleRenameValidation(id: string, description: string) {
    renameLocalValidation(id, description);
    if (user) renameValidationMutation.mutate({ id, description });
  }

  function handleDeleteBrainstorm(id: string) {
    if (user) {
      deleteGenerationMutation.mutate(id);
    } else {
      useResearchStore.getState().removeLocalHistory(id);
    }
  }

  function handleRenameBrainstorm(id: string, prompt: string) {
    if (user) renameGenerationMutation.mutate({ id, prompt });
    else useResearchStore.getState().renameLocalHistory(id, prompt);
  }

  return (
    <AppShell>
      <main className="relative mx-auto flex max-w-5xl flex-col gap-10 px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70">
            Workspace
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All your past validations and brainstorm sessions.
            </p>
          </div>
        </div>

        {/* Search + Tabs row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-border bg-card/50 p-1 w-fit">
            {(['validations', 'brainstorms'] as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'rounded-lg capitalize font-medium normal-case tracking-normal',
                  activeTab === tab
                    ? 'bg-white/8 text-foreground hover:bg-white/8'
                    : 'text-muted-foreground/60 hover:text-foreground/80'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-8 pr-8 text-sm"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {workspaceLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card/60">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your history...
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'validations' && (
              <motion.section
                key="validations"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Validations
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {filteredValidations.length}
                  </span>
                </div>

                {validations.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary/[0.06] text-primary">
                      <History className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        No validations yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Run your first validation to see it here.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/validate">Validate an idea</Link>
                    </Button>
                  </div>
                ) : filteredValidations.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No validations match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredValidations.map((v, index) => (
                        <motion.div
                          key={v.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25, delay: index * 0.04 }}
                        >
                          <ValidationHistoryCard
                            {...v}
                            onDelete={() => handleDeleteValidation(v.id)}
                            onRename={(desc) =>
                              handleRenameValidation(v.id, desc)
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </motion.section>
            )}

            {activeTab === 'brainstorms' && (
              <motion.section
                key="brainstorms"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Brainstorms
                  </h2>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {filteredBrainstorms.length}
                  </span>
                </div>

                {brainstorms.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary/[0.06] text-primary">
                      <History className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        No brainstorms yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Run your first brainstorm to see it here.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/">Start brainstorming</Link>
                    </Button>
                  </div>
                ) : filteredBrainstorms.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No brainstorms match &ldquo;{query}&rdquo;
                  </p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredBrainstorms.map((b, index) => (
                        <motion.div
                          key={b.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25, delay: index * 0.04 }}
                        >
                          <BrainstormHistoryCard
                            {...b}
                            onDelete={() => handleDeleteBrainstorm(b.id)}
                            onRename={(p) => handleRenameBrainstorm(b.id, p)}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        )}
      </main>
    </AppShell>
  );
}
