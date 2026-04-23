interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
}

export function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-lg bg-muted/30 border border-border/60">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-lg font-black tabular-nums leading-tight text-foreground/90">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground/55 leading-tight">{sub}</span>}
    </div>
  );
}
