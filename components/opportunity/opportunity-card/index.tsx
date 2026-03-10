'use client';

import { Bookmark } from 'lucide-react';
import type { Idea, SignalLevel } from '@/types';
import { computeOpportunityScore } from '@/lib/scoring';
import { useSavedIdea } from '@/hooks/use-saved-idea';
import { Tag } from './Tag';
import { DIFFICULTY_COLOR, SIGNAL_TAG, COMPETITION_TAG } from './constants';

interface OpportunityCardProps extends Idea {
  onExplore: () => void;
}

export function OpportunityCard({ onExplore, ...ideaProps }: OpportunityCardProps) {
  const idea  = ideaProps as Idea;
  const score = computeOpportunityScore(idea);
  const { saved, toggle: toggleSave } = useSavedIdea(idea);

  const buildSignal: SignalLevel =
    idea.difficulty === 'Easy' ? 'High' : idea.difficulty === 'Medium' ? 'Medium' : 'Low';

  return (
    <div
      className="group rounded-xl p-5 transition-colors duration-200 cursor-pointer hover:border-[var(--accent)]/30"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
      onClick={onExplore}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[14px] font-bold uppercase tracking-wide leading-snug" style={{ color: 'var(--text-1)' }}>
          {idea.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold" style={{ color: 'var(--text-4)' }}>
            <span style={{ color: 'var(--text-1)' }}>{score}</span>/10
          </span>
          <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${DIFFICULTY_COLOR[idea.difficulty]}`}>
            {idea.difficulty}
          </span>
        </div>
      </div>

      {/* Pitch */}
      <p className="text-xs leading-relaxed line-clamp-1 mb-3" style={{ color: 'var(--text-3)' }}>
        {idea.pitch}
      </p>

      {/* Problem + Audience */}
      <dl className="space-y-1.5 mb-4">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: 'var(--text-4)' }}>Problem</dt>
          <dd className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{idea.problem}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: 'var(--text-4)' }}>Audience</dt>
          <dd className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{idea.audience}</dd>
        </div>
      </dl>

      {/* Signal tags + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag label="Demand"      value={idea.marketDemand}    cls={SIGNAL_TAG[idea.marketDemand]} />
        <Tag label="Competition" value={idea.competitionLevel} cls={COMPETITION_TAG[idea.competitionLevel]} />
        <Tag label="Build"       value={idea.difficulty}       cls={SIGNAL_TAG[buildSignal]} />

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); toggleSave(); }}
            className="transition-colors duration-150"
            style={{ color: saved ? 'var(--accent)' : 'var(--text-4)' }}
            title={saved ? 'Unsave' : 'Save idea'}
          >
            <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <span
            className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-150"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
          >
            Explore →
          </span>
        </div>
      </div>
    </div>
  );
}
