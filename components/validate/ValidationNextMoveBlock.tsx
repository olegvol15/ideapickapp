'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cap } from '@/lib/validate/scores';
import { buildQuantifiedWinSignals } from '@/lib/validate/narratives';
import { getDisplayNextStep, shouldShowPrimaryAction, shouldShowStartBuilding, STEP_LABEL } from '@/lib/validate/next-move';
import { SectionHeading } from './SectionHeading';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationNextMoveBlockProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

export function ValidationNextMoveBlock({ result, ideaContext }: ValidationNextMoveBlockProps) {
  const router = useRouter();
  const { decision, nextStepType, validationEffort, nicheAnalysis, bestEntryStrategy } = result;

  const isDrop   = decision === 'drop';
  const hasNiche = !!(nicheAnalysis && bestEntryStrategy === 'ENTER_VIA_NICHE');

  const quantifiedWinSignals = buildQuantifiedWinSignals(result, ideaContext);
  const nextMoveContext      = quantifiedWinSignals[0] ?? result.whereToWin?.[0]?.opportunity ?? null;

  const displayNextStep    = getDisplayNextStep(result);
  const showPrimaryAction  = shouldShowPrimaryAction(result);
  const showStartBuilding  = shouldShowStartBuilding(result);

  async function copyNextStep() {
    if (!result.nextStep) return;
    try { await navigator.clipboard.writeText(result.nextStep); toast.success('Copied'); }
    catch { toast.error('Could not copy'); }
  }

  return (
    <div className="rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SectionHeading>Next move</SectionHeading>
        <p className="text-sm font-semibold text-foreground leading-snug">{displayNextStep}</p>
        {nextMoveContext && (
          <p className="text-xs text-muted-foreground/60 leading-snug">
            <span className="font-semibold">Why: </span>{nextMoveContext}
          </p>
        )}
      </div>
      {validationEffort && !isDrop && (
        <div className="flex items-center gap-4">
          {[
            { k: 'Time', v: validationEffort.time },
            { k: 'Cost', v: validationEffort.cost },
            { k: 'Difficulty', v: cap(validationEffort.difficulty) },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{k}:</span>
              <span className="text-xs font-semibold text-foreground/80">{v}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {isDrop && !hasNiche ? (
          <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => router.push('/validate')}>
            Try Another Angle <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : isDrop && hasNiche ? (
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 justify-between" onClick={copyNextStep}>
              Copy Strategy <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/validate')}>
              Try Another Angle
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {showPrimaryAction && (
              <Button size="sm" className="flex-1 justify-between">
                {STEP_LABEL[nextStepType!]} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 ${showPrimaryAction ? '' : 'flex-1'}`}
              onClick={copyNextStep}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
            {showStartBuilding && (
              <Button
                size="sm"
                variant="outline"
                className={showPrimaryAction ? '' : 'flex-1'}
                onClick={() => router.push('/research')}
              >
                Start Building
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
