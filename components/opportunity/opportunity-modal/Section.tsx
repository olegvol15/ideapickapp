import type { ReactNode } from 'react';

export interface SectionProps {
  title:    string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="pt-5" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-4)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}
