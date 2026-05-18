import { getDecisionStatement } from '@/lib/validate/decision';
import { buildWhatThisMeans, buildActionableSteps } from '@/lib/validate/narratives';
import { SectionHeading } from './SectionHeading';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationSummaryCardProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

const DECISION_BADGE: Record<
  'proceed' | 'test-first' | 'drop',
  { label: string; className: string }
> = {
  proceed: {
    label: 'Proceed',
    className:
      'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
  },
  'test-first': {
    label: 'Validate First',
    className: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
  },
  drop: {
    label: "Don't Build This",
    className: 'bg-rose-500/15 text-rose-600 border border-rose-500/30',
  },
};

export function ValidationSummaryCard({
  result,
  ideaContext,
}: ValidationSummaryCardProps) {
  const { decision, decisionReason, verdict, keyInsights } = result;

  const badge = decision ? DECISION_BADGE[decision] : null;
  const headline = decisionReason ?? getDecisionStatement(result);

  const insightBullets =
    keyInsights && keyInsights.length > 0
      ? keyInsights
      : buildWhatThisMeans(result, ideaContext).bullets;

  const steps = buildActionableSteps(result, ideaContext);

  const hasInsights = insightBullets.length > 0;
  const hasSteps = steps.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {badge && (
          <span
            className={`self-start text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        {headline && (
          <p className="text-sm font-semibold text-foreground leading-snug">
            {headline}
          </p>
        )}
        {verdict && (
          <p className="text-sm text-foreground/75 leading-relaxed">{verdict}</p>
        )}
      </div>

      {hasInsights && (
        <>
          <div className="border-t border-border/60" />
          <div className="flex flex-col gap-3">
            <SectionHeading>Key insights</SectionHeading>
            <ul className="flex flex-col gap-2">
              {insightBullets.map((insight, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground/75 leading-snug"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {hasSteps && (
        <>
          <div className="border-t border-border/60" />
          <div className="flex flex-col gap-3">
            <SectionHeading>Your angle</SectionHeading>
            <div className="flex flex-col gap-2.5">
              {steps.map(({ label, text }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 w-28 shrink-0 mt-[3px]">
                    {label}
                  </span>
                  <span className="text-sm text-foreground/75 leading-snug">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
