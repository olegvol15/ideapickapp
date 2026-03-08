"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import type { Idea, DifficultyLevel, SignalLevel } from "@/types";
import { computeOpportunityScore } from "@/lib/scoring";
import { isSaved, toggleSave } from "@/lib/saved-ideas";

// ─── Color maps ───────────────────────────────────────────────────────────────

const difficultyBadge: Record<DifficultyLevel, string> = {
  Easy:   "text-emerald-400 border-emerald-400/30",
  Medium: "text-amber-400 border-amber-400/30",
  Hard:   "text-brand border-brand/40",
};

const signalTag: Record<SignalLevel, string> = {
  High:   "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]",
  Medium: "text-amber-400   border-amber-400/20   bg-amber-400/[0.06]",
  Low:    "text-zinc-500    border-zinc-800        bg-zinc-900",
};

const competitionTag: Record<SignalLevel, string> = {
  Low:    "text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]",
  Medium: "text-amber-400   border-amber-400/20   bg-amber-400/[0.06]",
  High:   "text-brand       border-brand/20        bg-brand/[0.06]",
};

function Tag({ label, value, style }: { label: string; value: string; style: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${style}`}>
      <span className="opacity-50">{label}</span>
      <span className="opacity-30">·</span>
      {value}
    </span>
  );
}

const DT = "w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest text-zinc-600 pt-[1px]";
const DD = "text-xs text-zinc-400 leading-snug";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface OpportunityCardProps extends Idea {
  onExplore: () => void;
}

export function OpportunityCard({
  title, pitch, problem, audience, difficulty,
  marketDemand, competitionLevel, onExplore,
  ...rest
}: OpportunityCardProps) {
  const idea = { title, pitch, problem, audience, difficulty, marketDemand, competitionLevel, ...rest } as Idea;
  const score = computeOpportunityScore(idea);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(title));
  }, [title]);

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    const next = toggleSave(idea);
    setSaved(next);
  }

  return (
    <div
      className="group rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5 transition-colors duration-200 hover:border-zinc-700/60 cursor-pointer"
      onClick={onExplore}
    >
      {/* Title + difficulty */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[14px] font-bold uppercase tracking-wide text-white leading-snug">
          {title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-zinc-500">
            <span className="text-zinc-300">{score}</span>/10
          </span>
          <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${difficultyBadge[difficulty]}`}>
            {difficulty}
          </span>
        </div>
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

      {/* Signal tags + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag label="Demand"      value={marketDemand}    style={signalTag[marketDemand]} />
        <Tag label="Competition" value={competitionLevel} style={competitionTag[competitionLevel]} />
        <Tag label="Build"       value={difficulty}       style={signalTag[difficulty === "Easy" ? "High" : difficulty === "Medium" ? "Medium" : "Low"]} />

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleSave}
            className={`transition-colors duration-150 ${saved ? "text-brand" : "text-zinc-700 hover:text-zinc-400"}`}
            title={saved ? "Unsave" : "Save idea"}
          >
            <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-brand transition-colors duration-150">
            Explore →
          </span>
        </div>
      </div>
    </div>
  );
}
