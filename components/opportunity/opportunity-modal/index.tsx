'use client';

import { useEffect } from 'react';
import { X, Bookmark, Loader2, ShieldCheck, Wand2, Map } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { Idea, DifficultyLevel, SignalLevel } from '@/types';
import { computeOpportunityScore } from '@/lib/scoring';
import { useSavedIdea } from '@/hooks/use-saved-idea';
import { useIdeaActions } from '@/hooks/use-idea-actions';
import { setPlan } from '@/services/storage.service';
import { REFINE_PRESETS } from '@/constants/products';
import { Section } from './Section';
import { ScoreBar } from './ScoreBar';

// ─── Color maps ────────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  Easy:   'text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30',
  Medium: 'text-amber-600   border-amber-500/30   dark:text-amber-400   dark:border-amber-400/30',
  Hard:   'text-rose-600    border-rose-500/30    dark:text-rose-400    dark:border-rose-400/30',
};

const SIGNAL_COLOR: Record<SignalLevel, string> = {
  High:   'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600   dark:text-amber-400',
  Low:    'text-[#6d89a9]   dark:text-[#4e6f8a]',
};

const COMPETITION_COLOR: Record<SignalLevel, string> = {
  Low:    'text-emerald-600 dark:text-emerald-400',
  Medium: 'text-amber-600   dark:text-amber-400',
  High:   'text-rose-600    dark:text-rose-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

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
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <div className="min-h-full flex items-start justify-center p-6 sm:p-10">
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={{ opacity: 0,   y: 12,  scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-xl rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.15)]"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="p-6 pb-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[i.difficulty]}`}>
                      {i.difficulty}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>{i.confidence}% confidence</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>·</span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-1)' }}>{score}/10</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>score</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={toggleSave}
                      className="rounded-lg p-1.5 transition-colors"
                      style={{ border: '1px solid var(--border)', color: saved ? 'var(--accent)' : 'var(--text-4)' }}
                      title={saved ? 'Unsave' : 'Save idea'}
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-1.5 transition-colors"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-4)' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold uppercase tracking-wide leading-snug mb-1" style={{ color: 'var(--text-1)' }}>
                  {i.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{i.pitch}</p>
              </div>

              {/* ── Body ── */}
              <div className="px-6 pb-6 space-y-5">

                <Section title="Idea Overview">
                  <dl className="space-y-2.5">
                    {([
                      ['Problem',       i.problem],
                      ['Audience',      i.audience],
                      ['Market Gap',    i.gap],
                      ['Differentiation', i.differentiation],
                    ] as const).map(([label, val]) => (
                      <div key={label} className="flex gap-3">
                        <dt className="w-28 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: 'var(--text-4)' }}>
                          {label}
                        </dt>
                        <dd className="text-sm leading-snug" style={{ color: 'var(--text-1)' }}>{val}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>

                <Section title="Market Intelligence">
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'Demand',       value: i.marketDemand,       cls: SIGNAL_COLOR[i.marketDemand] },
                      { label: 'Competition',  value: i.competitionLevel,    cls: COMPETITION_COLOR[i.competitionLevel] },
                      { label: 'Monetization', value: i.monetizationPotential, cls: SIGNAL_COLOR[i.monetizationPotential] },
                    ] as const).map(({ label, value, cls }) => (
                      <div key={label} className="rounded-lg p-3" style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-4)' }}>{label}</p>
                        <p className={`text-sm font-bold ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Build Planning">
                  <button
                    onClick={handleBuildRoadmap}
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-5 py-4 text-left transition-colors"
                    style={{ border: '1px solid var(--accent-hi)', backgroundColor: 'var(--accent-lo)' }}
                  >
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                        Open Workspace
                      </p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Build Roadmap →</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                        Visual mindmap · Stack · First users
                      </p>
                    </div>
                    <Map className="h-5 w-5 shrink-0" style={{ color: 'var(--accent)', opacity: 0.4 }} />
                  </button>
                </Section>

                <Section title="Refine This Idea">
                  <div className="flex flex-wrap gap-2">
                    {REFINE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => refine(preset)}
                        disabled={refining}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
                        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                      >
                        {refining ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5 opacity-50" />}
                        {preset}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Validate Idea">
                  {!validation ? (
                    <button
                      onClick={validate}
                      disabled={validating}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-3)' }}
                    >
                      {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3 opacity-60" />}
                      {validating ? 'Validating…' : 'Run Validation'}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Viability Score</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>{validation.score}/100</span>
                        </div>
                        <ScoreBar value={validation.score} />
                      </div>
                      <p className="text-xs leading-relaxed pl-3 italic" style={{ borderLeft: '2px solid var(--accent-hi)', color: 'var(--text-2)' }}>
                        {validation.verdict}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-2">Signals</p>
                          <ul className="space-y-1.5">
                            {validation.signals.map((s, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>
                                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 mb-2">Risks</p>
                          <ul className="space-y-1.5">
                            {validation.risks.map((r, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>
                                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-rose-500/50" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button onClick={clearValidation} className="text-[10px] transition-colors" style={{ color: 'var(--text-4)' }}>
                        Clear validation
                      </button>
                    </div>
                  )}
                </Section>

              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
