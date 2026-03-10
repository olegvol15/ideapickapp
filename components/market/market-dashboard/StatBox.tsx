export interface StatBoxProps {
  label: string;
  value: string;
  sub?: string;
}

export function StatBox({ label, value, sub }: StatBoxProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-4)' }}>
        {label}
      </p>
      <p className="text-base font-bold leading-none" style={{ color: 'var(--text-1)' }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-3)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
