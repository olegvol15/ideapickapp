'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PainQuoteItem } from './PainQuoteItem';
import type { PainTheme } from '@/lib/schemas';

interface PainThemeBlockProps {
  theme: PainTheme;
}

export function PainThemeBlock({ theme }: PainThemeBlockProps) {
  const isRelated = theme.evidenceType === 'related';
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setHasOverflow(maxScrollLeft > 1);
    setCanScrollBack(track.scrollLeft > 1);
    setCanScrollForward(track.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollControls();
    const observer = new ResizeObserver(updateScrollControls);
    observer.observe(track);

    return () => observer.disconnect();
  }, [theme.quotes.length, updateScrollControls]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (firstCard.offsetWidth + gap),
      behavior: 'smooth',
    });
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    scrollByCard(event.key === 'ArrowLeft' ? -1 : 1);
  }

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
        <div className="flex shrink-0 items-center gap-2">
          {theme.mentionCount > 3 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
              {theme.mentionCount} mentions
            </span>
          )}
          {hasOverflow && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                disabled={!canScrollBack}
                aria-label={`Previous quotes in ${theme.label}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                disabled={!canScrollForward}
                aria-label={`Next quotes in ${theme.label}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        ref={trackRef}
        role="region"
        aria-label={`${theme.label} quotes`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={updateScrollControls}
        className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-scrollbar]:hidden"
      >
        {theme.quotes.map((quote, i) => (
          <div
            key={`${quote.url ?? ''}-${i}`}
            className="min-w-0 shrink-0 snap-start basis-full sm:basis-[calc((100%-0.75rem)/2)] lg:basis-[calc((100%-1.5rem)/3)]"
          >
            <PainQuoteItem quote={quote} />
          </div>
        ))}
      </div>
    </section>
  );
}
