'use client';

import { useEffect } from 'react';
import { X, Bookmark, Loader2, ShieldCheck, Wand2, Map } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Idea, DifficultyLevel, SignalLevel } from '@/types';
import { computeOpportunityScore } from '@/lib/scoring';
import { useSavedIdea } from '@/hooks/use-saved-idea';
import { useIdeaActions } from '@/hooks/use-idea-actions';
import { setPlan } from '@/services/storage.service';
import { REFINE_PRESETS } from '@/constants/products';
import { Section } from './Section';
import { ScoreBar } from './ScoreBar';

const DIFFICULTY_VARIANT: Record<DifficultyLevel, string> = {
  Easy:   'difficulty-easy',
  Medium: 'difficulty-medium',
  Hard:   'difficulty-hard',
};

const SIGNAL_COLOR: Record<SignalLevel, string> = {
  High:   'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600   dark:text-amber-400',
  Low:    'text-muted-foreground',
};

const COMPETITION_COLOR: Record<SignalLevel, string> = {
  Low:    'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600   dark:text-amber-400',
  High:   'text-rose-600    dark:text-rose-400',
};

interface OpportunityModalProps {
  idea:    Idea | null;
  onClose: () => void;
}

export function OpportunityModal({ idea, onClose }: OpportunityModalProps) {
  const router = useRouter();
  const { displayIdea, validation, refining, validating, refine, validate, clearValidation } =
    useIdeaActions(idea);
  const { saved, toggle: toggleSave } = useSavedIdea(displayIdea ?? ({} as Idea));

  useEffect(() => {
    if (!idea) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idea, onClose]);

  function handleBuildRoadmap() {
    if (!displayIdea) return;
    onClose();
    router.push(`/plan/${setPlan(displayIdea)}`);
  }

  const i     = displayIdea;
  const score = i ? computeOpportunityScore(i) : 0;

  return (
    <AnimatePresence>
      {idea && i && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="min-h-full flex items-start justify-center p-6 sm:p-10">
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={{ opacity: 0,   y: 12,  scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="shadow-[0_32px_80px_rgba(0,0,0,0.2)]">
                <CardContent className="p-0">

                  <div className="p-6 pb-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={DIFFICULTY_VARIANT[i.difficulty] as Parameters<typeof Badge>[0]['variant']}>
                          {i.difficulty}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{i.confidence}% confidence</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] font-bold text-foreground">{score}/10</span>
                        <span className="text-[10px] text-muted-foreground">score</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn('h-8 w-8', saved && 'text-primary border-primary/30')}
                          onClick={toggleSave}
                          title={saved ? 'Unsave' : 'Save idea'}
                        >
                          <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClose}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold uppercase tracking-wide leading-snug text-foreground mb-1">
                      {i.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-foreground/70">{i.pitch}</p>
                  </div>

                  <Separator />

                  <div className="p-6 space-y-5">

                    <Section title="Idea Overview">
                      <dl className="space-y-2.5">
                        {([
                          ['Problem',         i.problem],
                          ['Audience',        i.audience],
                          ['Market Gap',      i.gap],
                          ['Differentiation', i.differentiation],
                        ] as const).map(([label, val]) => (
                          <div key={label} className="flex gap-3">
                            <dt className="w-28 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-[1px]">
                              {label}
                            </dt>
                            <dd className="text-sm leading-snug text-foreground">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </Section>

                    <Section title="Market Intelligence">
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { label: 'Demand',       value: i.marketDemand,          cls: SIGNAL_COLOR[i.marketDemand] },
                          { label: 'Competition',  value: i.competitionLevel,       cls: COMPETITION_COLOR[i.competitionLevel] },
                          { label: 'Monetization', value: i.monetizationPotential,  cls: SIGNAL_COLOR[i.monetizationPotential] },
                        ] as const).map(({ label, value, cls }) => (
                          <div key={label} className="rounded-lg border border-border bg-muted p-3">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{label}</p>
                            <p className={cn('text-sm font-bold', cls)}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section title="Build Planning">
                      <button
                        onClick={handleBuildRoadmap}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] px-5 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
                      >
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">
                            Open Workspace
                          </p>
                          <p className="text-sm font-bold text-foreground">Build Roadmap →</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Visual mindmap · Stack · First users
                          </p>
                        </div>
                        <Map className="h-5 w-5 shrink-0 text-primary/40" />
                      </button>
                    </Section>

                    <Section title="Refine This Idea">
                      <div className="flex flex-wrap gap-2">
                        {REFINE_PRESETS.map((preset) => (
                          <Button
                            key={preset}
                            variant="outline"
                            size="sm"
                            onClick={() => refine(preset)}
                            disabled={refining}
                            className="text-[10px] tracking-widest h-8 gap-1.5"
                          >
                            {refining ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5 opacity-50" />}
                            {preset}
                          </Button>
                        ))}
                      </div>
                    </Section>

                    <Section title="Validate Idea">
                      {!validation ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={validate}
                          disabled={validating}
                          className="text-[10px] tracking-widest h-9 gap-2"
                        >
                          {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3 opacity-60" />}
                          {validating ? 'Validating…' : 'Run Validation'}
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                Viability Score
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {validation.score}/100
                              </span>
                            </div>
                            <ScoreBar value={validation.score} />
                          </div>

                          <p className="border-l-2 border-primary/20 pl-3 text-xs leading-relaxed italic text-foreground/70">
                            {validation.verdict}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-2">Signals</p>
                              <ul className="space-y-1.5">
                                {validation.signals.map((s, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug text-foreground/70">
                                    <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 mb-2">Risks</p>
                              <ul className="space-y-1.5">
                                {validation.risks.map((r, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug text-foreground/70">
                                    <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-rose-500/50" />{r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <Button variant="ghost" size="sm" onClick={clearValidation} className="h-7 text-[10px] text-muted-foreground">
                            Clear validation
                          </Button>
                        </div>
                      )}
                    </Section>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
