export interface StatBoxProps {
  label: string;
  value: string;
  sub?: string;
}

export function StatBox({ label, value, sub }: StatBoxProps) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
        {label}
      </p>
      <p className="text-base font-bold leading-none text-foreground">
        {value}
      </p>
      {sub && <p className="mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
