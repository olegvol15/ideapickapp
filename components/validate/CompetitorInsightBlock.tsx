'use client';

import { useState } from 'react';
import { Check, ChevronDown, ExternalLink, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { CompetitorBullet, CompetitorInsight } from '@/lib/schemas';

interface CompetitorInsightBlockProps {
  competitor: CompetitorInsight;
}

interface BulletListConfig {
  key: 'likes' | 'dislikes';
  title: string;
  titleClass: string;
  Icon: typeof Check;
  iconClass: string;
  bullets: CompetitorBullet[];
}

function competitorDomain(url?: string): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function CompetitorInsightBlock({
  competitor,
}: CompetitorInsightBlockProps) {
  const [expandedBullet, setExpandedBullet] = useState<string | null>(null);
  const domain = competitorDomain(competitor.url);

  const lists: BulletListConfig[] = [
    {
      key: 'likes',
      title: 'People like',
      titleClass: 'text-emerald-400/80',
      Icon: Check,
      iconClass: 'text-emerald-400',
      bullets: competitor.likes,
    },
    {
      key: 'dislikes',
      title: 'People complain about',
      titleClass: 'text-red-400/80',
      Icon: X,
      iconClass: 'text-red-400',
      bullets: competitor.dislikes,
    },
  ];

  return (
    <article className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card/60 p-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="h-7 w-7 rounded-full">
          {domain && (
            <AvatarImage
              src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
              alt=""
            />
          )}
          <AvatarFallback className="rounded-full text-[10px]">
            {competitor.name[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {competitor.name}
        </span>
        {competitor.url && (
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex min-w-0 max-w-[45%] items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            <span className="truncate">{domain}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        )}
      </div>

      <p className="text-sm leading-relaxed text-foreground/75">
        {competitor.description}
      </p>

      {lists.map(
        ({ key, title, titleClass, Icon, iconClass, bullets }) =>
          bullets.length > 0 && (
            <div key={key}>
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wider',
                  titleClass
                )}
              >
                {title}
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {bullets.map((bullet, index) => {
                  const bulletKey = `${key}-${index}`;
                  const expandable = bullet.sources.length > 0;
                  const expanded = expandedBullet === bulletKey;
                  return (
                    <li key={bulletKey} className="flex flex-col">
                      {expandable ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBullet(expanded ? null : bulletKey)
                          }
                          aria-expanded={expanded}
                          className="flex items-start gap-1.5 text-left text-sm text-foreground/80 hover:text-foreground"
                        >
                          <Icon
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 shrink-0',
                              iconClass
                            )}
                          />
                          <span className="min-w-0 flex-1">{bullet.text}</span>
                          <ChevronDown
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform',
                              expanded && 'rotate-180'
                            )}
                          />
                        </button>
                      ) : (
                        <span className="flex items-start gap-1.5 text-sm text-foreground/80">
                          <Icon
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 shrink-0',
                              iconClass
                            )}
                          />
                          {bullet.text}
                        </span>
                      )}
                      {expanded && (
                        <div className="ml-5 mt-1.5 flex flex-col gap-2 border-l-2 border-border pl-3">
                          {bullet.sources.map((source, sourceIndex) => (
                            <div key={sourceIndex}>
                              <p className="text-xs leading-relaxed text-foreground/65">
                                &ldquo;{source.text}&rdquo;
                              </p>
                              {source.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground"
                                >
                                  {source.label}
                                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                </a>
                              ) : (
                                <span className="mt-0.5 text-[11px] text-muted-foreground/50">
                                  {source.label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )
      )}

      {competitor.edge && (
        <div className="mt-auto rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary/80">
            Where your app can be better
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
            {competitor.edge}
          </p>
        </div>
      )}
    </article>
  );
}
