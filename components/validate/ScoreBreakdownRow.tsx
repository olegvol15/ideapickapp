import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/validate/colors';
import { colorClass } from '@/lib/validate/colors';

interface ScoreBreakdownRowProps {
  label: string;
  value: number;
  tone: Tone;
}

export function ScoreBreakdownRow({ label, value, tone }: ScoreBreakdownRowProps) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)_40px] items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/65 leading-tight">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/80">
        <div
          className={cn('h-full rounded-full', colorClass(tone, 'bg'))}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className={cn('text-right text-xs font-semibold tabular-nums', colorClass(tone, 'text'))}>{value}</span>
    </div>
  );
}
