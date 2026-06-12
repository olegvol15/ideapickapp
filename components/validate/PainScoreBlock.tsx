import { cn } from '@/lib/utils';
import type { ScoreBreakdown } from '@/lib/schemas';

interface PainScoreBlockProps {
  score: number;
  breakdown?: ScoreBreakdown;
}

const COMPONENTS: Array<{
  key: keyof ScoreBreakdown;
  label: string;
  weight: string;
}> = [
  { key: 'problemStrength', label: 'Problem strength', weight: '40%' },
  { key: 'complaintFrequency', label: 'Complaint frequency', weight: '35%' },
  { key: 'audienceReachability', label: 'Audience reach', weight: '25%' },
];

export function scoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500/15 text-emerald-400';
  if (score >= 40) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
}

export function PainScoreBlock({ score, breakdown }: PainScoreBlockProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card/60 px-4 py-3">
      <span
        className={cn(
          'rounded-lg px-3 py-1.5 text-lg font-bold tabular-nums',
          scoreColor(score)
        )}
      >
        {score}/100
      </span>
      {breakdown && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {COMPONENTS.map(({ key, label, weight }) => (
            <div key={key} className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground/60">{label}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground/85">
                {breakdown[key]}
              </span>
              <span className="text-[10px] text-muted-foreground/40">
                ×{weight}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
