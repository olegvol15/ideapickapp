import { cn } from '@/lib/utils';
import type { ScoreBreakdown } from '@/lib/schemas';

interface PainScoreBlockProps {
  score: number;
  breakdown?: ScoreBreakdown;
}

const COMPONENTS: Array<{
  key: 'problemStrength' | 'complaintFrequency' | 'audienceReachability';
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

function scoreVerdict(score: number): { label: string; text: string } {
  if (score >= 70) return { label: 'Strong', text: 'text-emerald-400' };
  if (score >= 40) return { label: 'Promising', text: 'text-amber-400' };
  return { label: 'Weak', text: 'text-red-400' };
}

function valueColor(value: number): string {
  if (value >= 70) return 'text-emerald-400';
  if (value >= 40) return 'text-amber-400';
  return 'text-red-400';
}

// Saturation is inverted: a crowded market is bad, an open one is good.
function saturationColor(value: number): string {
  if (value >= 70) return 'text-red-400';
  if (value >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}

export function PainScoreBlock({ score, breakdown }: PainScoreBlockProps) {
  const verdict = scoreVerdict(score);

  return (
    <div className="flex flex-col gap-3">
      {/* Big main score */}
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/60 px-6 py-7 text-center">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Idea score
        </span>
        <span
          className={cn(
            'text-6xl font-bold leading-none tracking-tight tabular-nums',
            verdict.text
          )}
        >
          {score}
        </span>
        <span className={cn('text-sm font-semibold', verdict.text)}>
          {verdict.label}
        </span>
      </div>

      {/* Driver tiles — how the score is weighted, plus the market saturation */}
      {breakdown && (
        <div className="grid grid-cols-2 gap-3">
          {COMPONENTS.map(({ key, label, weight }) => {
            const value = breakdown[key];
            return (
              <div
                key={key}
                className="flex flex-col gap-1 rounded-xl border border-border bg-card/60 p-4"
              >
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    valueColor(value)
                  )}
                >
                  {value}
                </span>
                <span className="text-xs leading-tight text-muted-foreground/60">
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  ×{weight} of score
                </span>
              </div>
            );
          })}

          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/60 p-4">
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                saturationColor(breakdown.marketSaturation ?? 0)
              )}
            >
              {breakdown.marketSaturation ?? 0}
            </span>
            <span className="text-xs leading-tight text-muted-foreground/60">
              Market saturation
            </span>
            <span className="text-[10px] text-muted-foreground/40">
              how crowded
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
