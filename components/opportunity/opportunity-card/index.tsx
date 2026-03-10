'use client';

import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Idea, SignalLevel } from '@/types';
import { computeOpportunityScore } from '@/lib/scoring';
import { useSavedIdea } from '@/hooks/use-saved-idea';
import { Tag } from './Tag';
import { DIFFICULTY_VARIANT, SIGNAL_VARIANT, COMPETITION_VARIANT } from './constants';

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
    <Card
      className="cursor-pointer transition-colors duration-200 hover:border-primary/30"
      onClick={onExplore}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[14px] font-bold uppercase tracking-wide leading-snug text-foreground">
            {idea.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground">
              <span className="text-foreground">{score}</span>/10
            </span>
            <Badge variant={DIFFICULTY_VARIANT[idea.difficulty]}>
              {idea.difficulty}
            </Badge>
          </div>
        </div>

        <p className="text-xs leading-relaxed line-clamp-1 mb-3 text-muted-foreground">
          {idea.pitch}
        </p>

        <dl className="space-y-1.5 mb-4">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-[1px]">Problem</dt>
            <dd className="text-xs leading-snug text-foreground/70">{idea.problem}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-[1px]">Audience</dt>
            <dd className="text-xs leading-snug text-foreground/70">{idea.audience}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <Tag label="Demand"      value={idea.marketDemand}    variant={SIGNAL_VARIANT[idea.marketDemand]} />
          <Tag label="Competition" value={idea.competitionLevel} variant={COMPETITION_VARIANT[idea.competitionLevel]} />
          <Tag label="Build"       value={idea.difficulty}       variant={SIGNAL_VARIANT[buildSignal]} />

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              onClick={(e) => { e.stopPropagation(); toggleSave(); }}
              title={saved ? 'Unsave' : 'Save idea'}
            >
              <Bookmark className="h-3.5 w-3.5" fill={saved ? 'currentColor' : 'none'} />
            </Button>
            <span className="group-hover:text-primary text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors duration-150">
              Explore →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
