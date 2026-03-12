interface ScoreBarProps {
  value: number;
}

export function ScoreBar({ value }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-border">
      <div
        className={`h-1 rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
