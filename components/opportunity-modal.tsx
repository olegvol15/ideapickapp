"use client";

import { useEffect, useState } from "react";
import { X, Bookmark, Loader2, ShieldCheck, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Idea, DifficultyLevel, SignalLevel, ValidationResult } from "@/types";
import { computeOpportunityScore } from "@/lib/scoring";
import { isSaved, toggleSave } from "@/lib/saved-ideas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const difficultyBadge: Record<DifficultyLevel, string> = {
  Easy:   "text-emerald-400 border-emerald-400/30",
  Medium: "text-amber-400 border-amber-400/30",
  Hard:   "text-brand border-brand/40",
};

const signalColor: Record<SignalLevel, string> = {
  High:   "text-emerald-400",
  Medium: "text-amber-400",
  Low:    "text-zinc-500",
};

const competitionColor: Record<SignalLevel, string> = {
  Low:    "text-emerald-400",
  Medium: "text-amber-400",
  High:   "text-brand",
};

const DT = "w-28 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]";
const DD = "text-sm text-zinc-300 leading-snug";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-800/60 pt-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">{title}</p>
      {children}
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 45 ? "bg-amber-400" : "bg-brand";
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-zinc-800">
      <div className={`h-1 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const REFINE_PRESETS = [
  "Make it simpler",
  "More profitable",
  "B2B focused",
  "AI-focused",
  "Easier to build",
];

// ─── Modal ────────────────────────────────────────────────────────────────────

interface Props {
  idea: Idea | null;
  onClose: () => void;
}

export function OpportunityModal({ idea, onClose }: Props) {
  const [displayIdea, setDisplayIdea] = useState<Idea | null>(null);
  const [saved, setSaved] = useState(false);
  const [refining, setRefining] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // Sync displayIdea when idea changes
  useEffect(() => {
    setDisplayIdea(idea);
    setValidation(null);
    if (idea) setSaved(isSaved(idea.title));
  }, [idea]);

  // Escape key
  useEffect(() => {
    if (!idea) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idea, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = idea ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [idea]);

  async function handleRefine(preset: string) {
    if (!displayIdea || refining) return;
    setRefining(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: displayIdea, instruction: preset }),
      });
      const refined = await res.json() as Idea;
      setDisplayIdea(refined);
      setValidation(null);
    } finally {
      setRefining(false);
    }
  }

  async function handleValidate() {
    if (!displayIdea || validating) return;
    setValidating(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: displayIdea }),
      });
      const result = await res.json() as ValidationResult;
      setValidation(result);
    } finally {
      setValidating(false);
    }
  }

  function handleSave() {
    if (!displayIdea) return;
    const next = toggleSave(displayIdea);
    setSaved(next);
  }

  const i = displayIdea;
  const score = i ? computeOpportunityScore(i) : 0;

  return (
    <AnimatePresence>
      {idea && i && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-xl rounded-2xl border border-zinc-800/80 bg-[#0d0d0d] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${difficultyBadge[i.difficulty]}`}>
                    {i.difficulty}
                  </span>
                  <span className="text-[10px] text-zinc-600">{i.confidence}% confidence</span>
                  <span className="text-[10px] text-zinc-600">·</span>
                  <span className="text-[10px] font-bold text-zinc-300">{score}/10</span>
                  <span className="text-[10px] text-zinc-600">score</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSave}
                    className={`rounded-lg border border-zinc-800 p-1.5 transition-colors ${saved ? "text-brand border-brand/30" : "text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"}`}
                    title={saved ? "Unsave" : "Save idea"}
                  >
                    <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold uppercase tracking-wide text-white leading-snug mb-1">
                {i.title}
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">{i.pitch}</p>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-5">

              {/* Overview */}
              <Section title="Idea Overview">
                <dl className="space-y-2.5">
                  <div className="flex gap-3">
                    <dt className={DT}>Problem</dt>
                    <dd className={DD}>{i.problem}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className={DT}>Audience</dt>
                    <dd className={DD}>{i.audience}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className={DT}>Market Gap</dt>
                    <dd className={DD}>{i.gap}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className={DT}>Differentiation</dt>
                    <dd className={DD}>{i.differentiation}</dd>
                  </div>
                </dl>
              </Section>

              {/* Market Intelligence */}
              <Section title="Market Intelligence">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Demand</p>
                    <p className={`text-sm font-bold ${signalColor[i.marketDemand]}`}>{i.marketDemand}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Competition</p>
                    <p className={`text-sm font-bold ${competitionColor[i.competitionLevel]}`}>{i.competitionLevel}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Monetization</p>
                    <p className={`text-sm font-bold ${signalColor[i.monetizationPotential]}`}>{i.monetizationPotential}</p>
                  </div>
                </div>
              </Section>

              {/* Build This Idea */}
              <Section title="Build This Idea">
                {/* MVP Roadmap */}
                {i.mvpRoadmap?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2.5">MVP Roadmap</p>
                    <ol className="space-y-2">
                      {i.mvpRoadmap.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400 leading-snug">
                          <span className="shrink-0 mt-[1px] h-4 w-4 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-500">
                            {idx + 1}
                          </span>
                          {step.replace(/^Step \d+:\s*/i, "")}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tech Stack */}
                {i.techStack?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2.5">Suggested Stack</p>
                    <div className="space-y-1.5">
                      {i.techStack.map((item) => (
                        <div key={item.layer} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600">{item.layer}</span>
                          <span className="text-xs text-zinc-300 font-medium">{item.tech}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* First Users */}
                {i.firstUsers?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2.5">Find First Users</p>
                    <ul className="space-y-1.5">
                      {i.firstUsers.map((u) => (
                        <li key={u} className="flex items-start gap-2 text-sm text-zinc-400 leading-snug">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand/50" />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* MVP Features */}
                {i.mvpFeatures?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2.5">MVP Features</p>
                    <ul className="space-y-1.5">
                      {i.mvpFeatures.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-zinc-400 leading-snug">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {/* Refine */}
              <Section title="Refine This Idea">
                <div className="flex flex-wrap gap-2">
                  {REFINE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleRefine(preset)}
                      disabled={refining}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors disabled:opacity-40"
                    >
                      {refining ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5 opacity-50" />}
                      {preset}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Validate */}
              <Section title="Validate Idea">
                {!validation ? (
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors disabled:opacity-40"
                  >
                    {validating
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <ShieldCheck className="h-3 w-3 opacity-60" />}
                    {validating ? "Validating…" : "Run Validation"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Score */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Viability Score</span>
                        <span className="text-xs font-bold text-zinc-300">{validation.score}/100</span>
                      </div>
                      <ScoreBar value={validation.score} />
                    </div>

                    {/* Verdict */}
                    <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-brand/30 pl-3 italic">
                      {validation.verdict}
                    </p>

                    {/* Signals + Risks */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-2">Signals</p>
                        <ul className="space-y-1.5">
                          {validation.signals.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-snug">
                              <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand/70 mb-2">Risks</p>
                        <ul className="space-y-1.5">
                          {validation.risks.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-snug">
                              <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-brand/50" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => setValidation(null)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      Clear validation
                    </button>
                  </div>
                )}
              </Section>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
