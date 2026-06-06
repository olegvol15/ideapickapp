import { getDecisionStatement } from '@/lib/validate/decision';
import { buildWhatThisMeans } from '@/lib/validate/narratives';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationSummaryCardProps {
  result: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

export function ValidationSummaryCard({
  result,
  ideaContext,
}: ValidationSummaryCardProps) {
  const { summary, verdict, keyInsights, decisionReason } = result;

  const headline = decisionReason ?? getDecisionStatement(result);
  const body = summary ?? verdict;

  const bullets =
    keyInsights && keyInsights.length > 0
      ? keyInsights.slice(0, 4)
      : buildWhatThisMeans(result, ideaContext).bullets.slice(0, 3);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {headline && (
        <p className="text-sm font-semibold text-foreground leading-snug">
          {headline}
        </p>
      )}
      {body && (
        <p className="text-sm text-foreground/75 leading-relaxed">{body}</p>
      )}
      {bullets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
            >
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
