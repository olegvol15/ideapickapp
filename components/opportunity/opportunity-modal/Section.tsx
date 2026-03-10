import type { ReactNode } from 'react';

export interface SectionProps {
  title:    string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="border-t border-border pt-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}
