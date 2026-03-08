"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Idea, DifficultyLevel, SignalLevel } from "@/types";

// ─── Color maps ───────────────────────────────────────────────────────────────

const difficultyBadge: Record<DifficultyLevel, string> = {
  Easy:   "text-emerald-400 border-emerald-400/30",
  Medium: "text-amber-400 border-amber-400/30",
  Hard:   "text-brand border-brand/40",
};

// High demand / High monetization = good (green)
const signalTag: Record<SignalLevel, string> = {
  High:   "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]",
  Medium: "text-amber-400   border-amber-400/20   bg-amber-400/[0.06]",
  Low:    "text-zinc-500    border-zinc-800        bg-zinc-900",
};

// High competition = bad (red), Low = good (green)
const competitionTag: Record<SignalLevel, string> = {
  Low:    "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]",
  Medium: "text-amber-400   border-amber-400/20   bg-amber-400/[0.06]",
  High:   "text-brand       border-brand/20        bg-brand/[0.06]",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label, value, style }: { label: string; value: string; style: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${style}`}>
      <span className="text-inherit opacity-50">{label}</span>
      <span className="text-inherit opacity-30">·</span>
      {value}
    </span>
  );
}

const DT = "w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]";
const DD = "text-xs text-zinc-400 leading-snug";

// ─── Main export ──────────────────────────────────────────────────────────────

export function OpportunityCard(idea: Idea) {
  const [open, setOpen] = useState(false);

  const {
    title, pitch, problem, audience, gap, differentiation,
    closestCompetitors, mvpFeatures, difficulty,
    marketDemand, competitionLevel, confidence,
  } = idea;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] transition-colors duration-200 hover:border-zinc-700/60">

      {/* ── Compact (always visible) ── */}
      <div className="p-5">

        {/* Title + difficulty */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[14px] font-bold uppercase tracking-wide text-white leading-snug">
            {title}
          </h3>
          <span className={`shrink-0 rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${difficultyBadge[difficulty]}`}>
            {difficulty}
          </span>
        </div>

        {/* Pitch — 1 line */}
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1 mb-3">{pitch}</p>

        {/* Problem + Audience */}
        <dl className="space-y-1.5 mb-4">
          <div className="flex gap-2">
            <dt className={DT}>Problem</dt>
            <dd className={DD}>{problem}</dd>
          </div>
          <div className="flex gap-2">
            <dt className={DT}>Audience</dt>
            <dd className={DD}>{audience}</dd>
          </div>
        </dl>

        {/* Signal tags + Explore toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <Tag label="Demand"      value={marketDemand}    style={signalTag[marketDemand]} />
          <Tag label="Competition" value={competitionLevel} style={competitionTag[competitionLevel]} />
          <Tag label="Build"       value={difficulty}       style={signalTag[difficulty === "Easy" ? "High" : difficulty === "Medium" ? "Medium" : "Low"]} />

          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-brand transition-colors duration-150"
          >
            {open ? <><ChevronUp className="h-3 w-3" />Collapse</> : <>Explore<ChevronDown className="h-3 w-3" /></>}
          </button>
        </div>
      </div>

      {/* ── Expanded details ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800/60 px-5 py-4 space-y-4">

              {/* Gap + Edge */}
              <dl className="space-y-2">
                <div className="flex gap-2">
                  <dt className={DT}>Gap</dt>
                  <dd className={DD}>{gap}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className={DT}>Edge</dt>
                  <dd className={DD}>{differentiation}</dd>
                </div>
              </dl>

              {/* MVP Features */}
              {mvpFeatures?.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2">MVP Features</p>
                  <ul className="space-y-1">
                    {mvpFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-500">
                        <span className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full bg-brand/50" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Closest competitors + confidence */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {closestCompetitors?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Competes with</span>
                    {closestCompetitors.map((c) => (
                      <span key={c} className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <span className="ml-auto text-[10px] text-zinc-600">{confidence}% confidence</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
