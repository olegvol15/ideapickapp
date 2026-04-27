import { cn } from '@/lib/utils';

interface CompareRowProps {
  label: string;
  base: number;
  niche: number;
  lowerBetter: boolean;
}

export function CompareRow({
  label,
  base,
  niche,
  lowerBetter,
}: CompareRowProps) {
  const improved = lowerBetter ? niche < base - 0.05 : niche > base + 0.05;
  const pctDiff =
    base > 0.05 ? Math.abs(Math.round(((niche - base) / base) * 100)) : 0;
  const arrow =
    (lowerBetter && niche < base) || (!lowerBetter && niche > base) ? '↓' : '↑';
  const diffLabel = lowerBetter
    ? niche < base
      ? `${arrow} ${pctDiff}% lower`
      : `${arrow} ${pctDiff}% higher`
    : niche > base
      ? `${arrow} ${pctDiff}% higher`
      : `${arrow} ${pctDiff}% lower`;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 text-muted-foreground/55">{label}:</span>
      <span className="font-mono text-foreground/50">{base.toFixed(1)}</span>
      <span className="text-muted-foreground/30">→</span>
      <span
        className={cn(
          'font-mono font-bold',
          improved ? 'text-emerald-400' : 'text-muted-foreground/60'
        )}
      >
        {niche.toFixed(1)}
      </span>
      {pctDiff > 0 && (
        <span
          className={cn(
            'text-[10px] font-semibold',
            improved ? 'text-emerald-400/70' : 'text-muted-foreground/40'
          )}
        >
          {diffLabel}
        </span>
      )}
    </div>
  );
}
