export interface TagProps {
  label: string;
  value: string;
  cls:   string;
}

export function Tag({ label, value, cls }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${cls}`}>
      <span className="opacity-50">{label}</span>
      <span className="opacity-30">·</span>
      {value}
    </span>
  );
}
