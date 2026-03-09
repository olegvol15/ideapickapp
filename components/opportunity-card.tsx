"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import type { Idea, DifficultyLevel, SignalLevel } from "@/types";
import { computeOpportunityScore } from "@/lib/scoring";
import { isSaved, toggleSave } from "@/lib/saved-ideas";

const difficultyColor: Record<DifficultyLevel, string> = {
  Easy:   "text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30",
  Medium: "text-amber-600   border-amber-500/30   dark:text-amber-400   dark:border-amber-400/30",
  Hard:   "text-rose-600    border-rose-500/30    dark:text-rose-400    dark:border-rose-400/30",
};

const signalTagCls: Record<SignalLevel, string> = {
  High:   "text-emerald-700 border-emerald-500/25 bg-emerald-50   dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]",
  Medium: "text-amber-700   border-amber-500/25   bg-amber-50     dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]",
  Low:    "text-[#6d89a9]   border-[#023E8A]/15   bg-[#f0f7ff]   dark:text-[#4e6f8a]   dark:border-white/8        dark:bg-white/4",
};

const competitionTagCls: Record<SignalLevel, string> = {
  Low:    "text-emerald-700 border-emerald-500/25 bg-emerald-50   dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]",
  Medium: "text-amber-700   border-amber-500/25   bg-amber-50     dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]",
  High:   "text-rose-600    border-rose-500/25    bg-rose-50      dark:text-rose-400    dark:border-rose-400/20    dark:bg-rose-400/[0.06]",
};

function Tag({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${cls}`}>
      <span className="opacity-50">{label}</span>
      <span className="opacity-30">·</span>
      {value}
    </span>
  );
}

interface OpportunityCardProps extends Idea {
  onExplore: () => void;
}

export function OpportunityCard({ title, pitch, problem, audience, difficulty, marketDemand, competitionLevel, onExplore, ...rest }: OpportunityCardProps) {
  const idea = { title, pitch, problem, audience, difficulty, marketDemand, competitionLevel, ...rest } as Idea;
  const score = computeOpportunityScore(idea);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setSaved(isSaved(title)); }, [title]);

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaved(toggleSave(idea));
  }

  return (
    <div
      className="group rounded-xl p-5 transition-colors duration-200 cursor-pointer hover:border-[var(--accent)]/30"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
      onClick={onExplore}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[14px] font-bold uppercase tracking-wide leading-snug" style={{ color: "var(--text-1)" }}>{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold" style={{ color: "var(--text-4)" }}>
            <span style={{ color: "var(--text-1)" }}>{score}</span>/10
          </span>
          <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${difficultyColor[difficulty]}`}>
            {difficulty}
          </span>
        </div>
      </div>

      <p className="text-xs leading-relaxed line-clamp-1 mb-3" style={{ color: "var(--text-3)" }}>{pitch}</p>

      <dl className="space-y-1.5 mb-4">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: "var(--text-4)" }}>Problem</dt>
          <dd className="text-xs leading-snug" style={{ color: "var(--text-2)" }}>{problem}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: "var(--text-4)" }}>Audience</dt>
          <dd className="text-xs leading-snug" style={{ color: "var(--text-2)" }}>{audience}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Tag label="Demand"      value={marketDemand}    cls={signalTagCls[marketDemand]} />
        <Tag label="Competition" value={competitionLevel} cls={competitionTagCls[competitionLevel]} />
        <Tag label="Build"       value={difficulty}       cls={signalTagCls[difficulty === "Easy" ? "High" : difficulty === "Medium" ? "Medium" : "Low"]} />
        <div className="ml-auto flex items-center gap-3">
          <button onClick={handleSave} className="transition-colors duration-150" style={{ color: saved ? "var(--accent)" : "var(--text-4)" }} title={saved ? "Unsave" : "Save idea"}>
            <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-150" style={{ color: "var(--text-4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}>
            Explore →
          </span>
        </div>
      </div>
    </div>
  );
}
