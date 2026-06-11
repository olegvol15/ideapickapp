'use client';

import { useState } from 'react';
import { PainQuoteItem } from './PainQuoteItem';
import type { PainTheme } from '@/lib/schemas';

interface PainThemeBlockProps {
  theme: PainTheme;
}

const INITIAL_VISIBLE_QUOTES = 6;

export function PainThemeBlock({ theme }: PainThemeBlockProps) {
  const isRelated = theme.evidenceType === 'related';
  const [expanded, setExpanded] = useState(false);
  const hasMore = theme.quotes.length > INITIAL_VISIBLE_QUOTES;
  const visibleQuotes = expanded
    ? theme.quotes
    : theme.quotes.slice(0, INITIAL_VISIBLE_QUOTES);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold leading-snug text-foreground">
            {isRelated ? theme.label : `“${theme.label}”`}
          </h3>
          {isRelated && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Related
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
          {theme.mentionCount} mention{theme.mentionCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleQuotes.map((quote, i) => (
          <PainQuoteItem key={`${quote.url ?? ''}-${i}`} quote={quote} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="self-start text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? 'Show less' : `Show all ${theme.quotes.length}`}
        </button>
      )}
    </section>
  );
}
