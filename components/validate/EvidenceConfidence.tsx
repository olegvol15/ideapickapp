import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  evidenceTypeCounts,
  matchedSourceCounts,
} from '@/lib/evidence/quote-pool';
import { computeEvidenceConfidence } from '@/lib/validate/evidence-confidence';
import type { ConfidenceLevel } from '@/lib/validate/evidence-confidence';
import type { PainEvidenceResult } from '@/lib/schemas';

interface EvidenceConfidenceProps {
  result: PainEvidenceResult;
}

const CONFIDENCE_COPY: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

const badge = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
  {
    variants: {
      level: {
        high: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        medium: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        low: 'border-red-500/30 bg-red-500/10 text-red-400',
      },
    },
  }
);

export function EvidenceConfidence({ result }: EvidenceConfidenceProps) {
  const confidence = computeEvidenceConfidence(result);
  const evidenceCounts = evidenceTypeCounts(result);
  const sourceCounts = matchedSourceCounts(result);

  const chips = [
    `${result.totalQuotes} mention${result.totalQuotes !== 1 ? 's' : ''} reviewed`,
    confidence.distinctSources > 0 &&
      `${confidence.distinctSources} distinct source${confidence.distinctSources !== 1 ? 's' : ''}`,
    evidenceCounts.complaint > 0 &&
      `${evidenceCounts.complaint} complaint${evidenceCounts.complaint !== 1 ? 's' : ''}`,
    evidenceCounts.related > 0 && `${evidenceCounts.related} related`,
    result.themes.length > 0 &&
      `${result.themes.length} theme${result.themes.length !== 1 ? 's' : ''}`,
    sourceCounts.reddit > 0 && `${sourceCounts.reddit} Reddit`,
    sourceCounts.web > 0 && `${sourceCounts.web} forum/web`,
    sourceCounts.appstore > 0 && `${sourceCounts.appstore} App Store`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn(badge({ level: confidence.level }))}>
        {CONFIDENCE_COPY[confidence.level]}
      </span>
      {chips.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs tabular-nums text-muted-foreground/70"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
