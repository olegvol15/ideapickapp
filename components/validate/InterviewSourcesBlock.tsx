import { ExternalLink, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  buildInterviewSources,
  type InterviewSource,
} from '@/lib/validate/interview-sources';
import type { PainEvidenceResult } from '@/lib/schemas';

interface InterviewSourcesBlockProps {
  result: PainEvidenceResult;
}

function countLabel(source: InterviewSource): string {
  const noun = source.kind === 'reddit' ? 'complaint' : 'mention';
  return `${source.count} ${noun}${source.count === 1 ? '' : 's'}`;
}

export function InterviewSourcesBlock({ result }: InterviewSourcesBlockProps) {
  const sources = buildInterviewSources(result);
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MapPin className="h-4 w-4 text-brand" />
        Where to find them
      </div>
      <div className="flex flex-col gap-2">
        {sources.map((source) => {
          const inner = (
            <>
              <Avatar className="h-7 w-7 rounded-full">
                <AvatarImage
                  src={`https://icons.duckduckgo.com/ip3/${source.faviconDomain}.ico`}
                  alt=""
                />
                <AvatarFallback className="rounded-full text-[10px]">
                  {source.label[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                {source.label}
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground/60">
                {countLabel(source)}
              </span>
              {source.url && (
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              )}
            </>
          );

          const className =
            'flex items-center gap-2.5 rounded-xl border border-border bg-card/60 p-3';

          return source.url ? (
            <a
              key={source.label}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${className} transition-colors hover:bg-card`}
            >
              {inner}
            </a>
          ) : (
            <div key={source.label} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
