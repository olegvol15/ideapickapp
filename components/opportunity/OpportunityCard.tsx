'use client';

import { Bookmark } from 'lucide-react';
import type { Idea, DifficultyLevel, SignalLevel } from '@/types';
import { computeOpportunityScore } from '@/lib/scoring';
import { useSavedIdea } from '@/hooks/use-saved-idea';

// ─── Color maps ────────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  Easy: 'text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30',
  Medium:
    'text-amber-600   border-amber-500/30   dark:text-amber-400   dark:border-amber-400/30',
  Hard: 'text-rose-600    border-rose-500/30    dark:text-rose-400    dark:border-rose-400/30',
};

const SIGNAL_TAG: Record<SignalLevel, string> = {
  High: 'text-emerald-700 border-emerald-500/25 bg-emerald-50   dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
  Medium:
    'text-amber-700   border-amber-500/25   bg-amber-50     dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]',
  Low: 'text-[#6d89a9]   border-[#023E8A]/15   bg-[#f0f7ff]   dark:text-[#4e6f8a]   dark:border-white/8        dark:bg-white/4',
};

const COMPETITION_TAG: Record<SignalLevel, string> = {
  Low: 'text-emerald-700 border-emerald-500/25 bg-emerald-50  dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
  Medium:
    'text-amber-700   border-amber-500/25   bg-amber-50    dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]',
  High: 'text-rose-600    border-rose-500/25    bg-rose-50     dark:text-rose-400    dark:border-rose-400/20    dark:bg-rose-400/[0.06]',
};

function buildSignalTag(level: SignalLevel): string {
  return SIGNAL_TAG[level];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TagProps {
  label: string;
  value: string;
  cls: string;
}

function Tag({ label, value, cls }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${cls}`}
    >
      <span className="opacity-50">{label}</span>
      <span className="opacity-30">·</span>
      {value}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OpportunityCardProps extends Idea {
  onExplore: () => void;
}

export function OpportunityCard({
  onExplore,
  ...ideaProps
}: OpportunityCardProps) {
  const idea = ideaProps as Idea;
  const score = computeOpportunityScore(idea);
  const { saved, toggle: toggleSave } = useSavedIdea(idea);

  const buildSignal: SignalLevel =
    idea.difficulty === 'Easy'
      ? 'High'
      : idea.difficulty === 'Medium'
        ? 'Medium'
        : 'Low';

  return (
    <div
      className="group rounded-xl p-5 transition-colors duration-200 cursor-pointer hover:border-[var(--accent)]/30"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
      onClick={onExplore}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className="text-[14px] font-bold uppercase tracking-wide leading-snug"
          style={{ color: 'var(--text-1)' }}
        >
          {idea.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-bold"
            style={{ color: 'var(--text-4)' }}
          >
            <span style={{ color: 'var(--text-1)' }}>{score}</span>/10
          </span>
          <span
            className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[idea.difficulty]}`}
          >
            {idea.difficulty}
          </span>
        </div>
      </div>

      {/* Pitch */}
      <p
        className="text-xs leading-relaxed line-clamp-1 mb-3"
        style={{ color: 'var(--text-3)' }}
      >
        {idea.pitch}
      </p>

      {/* Problem + Audience */}
      <dl className="space-y-1.5 mb-4">
        <div className="flex gap-2">
          <dt
            className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]"
            style={{ color: 'var(--text-4)' }}
          >
            Problem
          </dt>
          <dd
            className="text-xs leading-snug"
            style={{ color: 'var(--text-2)' }}
          >
            {idea.problem}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt
            className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]"
            style={{ color: 'var(--text-4)' }}
          >
            Audience
          </dt>
          <dd
            className="text-xs leading-snug"
            style={{ color: 'var(--text-2)' }}
          >
            {idea.audience}
          </dd>
        </div>
      </dl>

      {/* Signal tags + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag
          label="Demand"
          value={idea.marketDemand}
          cls={SIGNAL_TAG[idea.marketDemand]}
        />
        <Tag
          label="Competition"
          value={idea.competitionLevel}
          cls={COMPETITION_TAG[idea.competitionLevel]}
        />
        <Tag
          label="Build"
          value={idea.difficulty}
          cls={buildSignalTag(buildSignal)}
        />

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSave();
            }}
            className="transition-colors duration-150"
            style={{ color: saved ? 'var(--accent)' : 'var(--text-4)' }}
            title={saved ? 'Unsave' : 'Save idea'}
          >
            <Bookmark
              className="h-3.5 w-3.5"
              fill={saved ? 'currentColor' : 'none'}
            />
          </button>
          <span
            className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-150"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--accent)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--text-4)')
            }
          >
            Explore →
          </span>
        </div>
      </div>
    </div>
  );
}
