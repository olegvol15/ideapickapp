'use client';

import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import type { ReviewTheme } from '@/lib/schemas';

interface ValidationReviewThemesBlockProps {
  reviewThemes: ReviewTheme[];
}

const FREQUENCY_STYLE: Record<
  ReviewTheme['frequency'],
  { label: string; className: string }
> = {
  rare: {
    label: 'Rare',
    className: 'bg-muted/60 text-muted-foreground/60 border-border/30',
  },
  common: {
    label: 'Common',
    className:
      'bg-amber-500/10 text-amber-500/80 border-amber-500/20',
  },
  frequent: {
    label: 'Frequent',
    className: 'bg-rose-500/10 text-rose-500/80 border-rose-500/20',
  },
};

export function ValidationReviewThemesBlock({
  reviewThemes,
}: ValidationReviewThemesBlockProps) {
  if (reviewThemes.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-8 pb-8 flex flex-col gap-4">
      <SectionHeading>What Users Complain About</SectionHeading>
      <div className="flex flex-col gap-4">
        {reviewThemes.map((theme, i) => {
          const freq = FREQUENCY_STYLE[theme.frequency];
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground/85 leading-snug">
                  {theme.theme}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                    freq.className
                  )}
                >
                  {freq.label}
                </span>
              </div>
              {theme.examples.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {theme.examples.map((ex, j) => (
                    <li
                      key={j}
                      className="text-xs text-muted-foreground/65 leading-snug pl-3 border-l-2 border-border/50 italic"
                    >
                      &ldquo;{ex}&rdquo;
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
