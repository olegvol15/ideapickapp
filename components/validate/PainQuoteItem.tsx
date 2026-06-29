'use client';

import { useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PainQuote } from '@/lib/schemas';

interface PainQuoteItemProps {
  quote: PainQuote;
}

function avatarDomain(quote: PainQuote): string {
  if (quote.source === 'reddit') return 'reddit.com';
  if (quote.source === 'appstore') return 'apps.apple.com';
  if (quote.source === 'x') return 'x.com';
  try {
    return new URL(quote.url ?? '').hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function displayName(quote: PainQuote): string {
  if (!quote.author) return quote.sourceLabel;
  if (quote.source === 'reddit') return `u/${quote.author}`;
  if (quote.source === 'x') return `@${quote.author}`;
  return quote.author;
}

function linkLabel(quote: PainQuote): string {
  if (quote.source === 'reddit') return quote.sourceLabel.replace(/^Reddit /, '');
  if (quote.source === 'appstore') return `App Store · ${quote.appName ?? ''}`;
  if (quote.source === 'x') return 'X';
  return quote.sourceLabel;
}

export function PainQuoteItem({ quote }: PainQuoteItemProps) {
  const [expanded, setExpanded] = useState(false);
  const name = displayName(quote);
  const domain = avatarDomain(quote);
  const rating = quote.rating;
  const canExpand = quote.text.length > 220;

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card/60 p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="h-7 w-7 rounded-full">
          {domain && (
            <AvatarImage
              src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
              alt=""
            />
          )}
          <AvatarFallback className="rounded-full text-[10px]">
            {name[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {name}
        </span>
        {quote.url ? (
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex min-w-0 max-w-[45%] items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            <span className="truncate">{linkLabel(quote)}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ) : (
          <span className="ml-auto max-w-[45%] truncate text-xs text-muted-foreground/60">
            {linkLabel(quote)}
          </span>
        )}
      </div>

      {rating != null && (
        <div className="mt-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3 w-3',
                i < rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/25'
              )}
            />
          ))}
        </div>
      )}

      <p
        className={cn(
          'mt-2 text-sm leading-relaxed text-foreground/80',
          canExpand && !expanded && 'line-clamp-6'
        )}
      >
        {quote.text}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 self-start text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </article>
  );
}
