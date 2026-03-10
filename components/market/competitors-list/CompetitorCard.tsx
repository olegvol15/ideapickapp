import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { CompetitorAnalysis } from '@/types';
import { CompetitorLogo } from './CompetitorLogo';

export function CompetitorCard({
  name,
  domain,
  url,
  strengths,
  weaknesses,
}: CompetitorAnalysis) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <CompetitorLogo domain={domain} name={name} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug text-foreground">{name}</p>
            <p className="text-[11px] mt-0.5 text-muted-foreground">{domain}</p>
          </div>

          <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary">
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Visit {name}</span>
            </a>
          </Button>
        </div>

        <Separator className="mb-4" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-2">
              Strengths
            </p>
            <ul className="space-y-1.5">
              {strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[11px] leading-snug text-foreground/70">
                  <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 mb-2">
              Weaknesses
            </p>
            <ul className="space-y-1.5">
              {weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-[11px] leading-snug text-foreground/70">
                  <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-rose-500/50" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
