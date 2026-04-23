import { cn } from '@/lib/utils';
import { getLevel, metricTone, colorClass } from '@/lib/validate/colors';

interface MetricBarProps {
  label: string;
  score: number;
  invert?: boolean;
  explanation?: string;
}

export function MetricBar({ label, score, invert = false, explanation }: MetricBarProps) {
  const level = getLevel(score);
  const tone  = metricTone(level, invert);
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[128px_60px_minmax(0,1fr)_32px] items-center gap-3">
        <span className="text-sm font-semibold text-foreground/80">{label}</span>
        <span className={cn('text-[11px] font-bold tracking-wider', colorClass(tone, 'text'))}>{level}</span>
        <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
          <div
            className={cn('h-full rounded-full transition-[width] duration-700 ease-out', colorClass(tone, 'bg'))}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
        <span className="text-right text-xs font-semibold tabular-nums text-muted-foreground/50">{score}</span>
      </div>
      {explanation && (
        <p className="pl-[calc(128px+12px)] text-[11px] text-muted-foreground/55 leading-snug">{explanation}</p>
      )}
    </div>
  );
}
