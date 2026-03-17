import { ExternalLink } from 'lucide-react';
import type { Competitor, CompetitorAnalysis } from '@/types';
import { CompetitorCard } from './CompetitorCard';
import { CompetitorLogo } from './CompetitorLogo';

interface CompetitorsListProps {
  competitors: Competitor[];
  analyzed: CompetitorAnalysis[];
}

function RawCompetitorRow({ name, url, snippet, source }: Competitor) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <CompetitorLogo domain={source} name={name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-foreground truncate">
          {name}
        </p>
        {snippet && (
          <p className="text-[11px] mt-0.5 leading-snug text-muted-foreground line-clamp-2">
            {snippet}
          </p>
        )}
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="sr-only">Visit {name}</span>
      </a>
    </div>
  );
}

export function CompetitorsList({ competitors, analyzed }: CompetitorsListProps) {
  if (!competitors?.length && !analyzed?.length) {
    return (
      <p className="text-xs py-6 text-center text-muted-foreground">
        No competitor data available — analysis based on training knowledge
      </p>
    );
  }

  const analyzedUrls = new Set(analyzed.map((c) => c.url));
  const remaining = competitors.filter((c) => !analyzedUrls.has(c.url));

  return (
    <div className="flex flex-col gap-3">
      {analyzed.map((c) => (
        <CompetitorCard key={c.url} {...c} />
      ))}

      {remaining.length > 0 && (
        <>
          {analyzed.length > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-2">
              Also discovered
            </p>
          )}
          {remaining.map((c) => (
            <RawCompetitorRow key={c.url} {...c} />
          ))}
        </>
      )}
    </div>
  );
}
