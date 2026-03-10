import { TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MarketContext, Gap } from '@/types';
import { ScoreBar } from './ScoreBar';
import { StatBox } from './StatBox';

interface MarketDashboardProps {
  marketContext: MarketContext;
  gaps:          Gap[];
}

export function MarketDashboard({ marketContext, gaps }: MarketDashboardProps) {
  const {
    theme, marketCondition, opportunityScore,
    marketSize, growthRate, signals, mainPatterns, competitorsFound,
  } = marketContext;
  const topGap = gaps?.[0];

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Market Overview
            </CardTitle>
            <span className="ml-auto text-[10px] text-muted-foreground/60">
              {competitorsFound} sources
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm font-bold text-foreground mb-0.5">{theme}</p>
          <p className="text-xs text-muted-foreground mb-4">{marketCondition}</p>

          <div className="mb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Opportunity Score
              </span>
              <span className="text-xs font-bold text-foreground">{opportunityScore}/100</span>
            </div>
            <ScoreBar value={opportunityScore} />
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <StatBox label="Market Size" value={marketSize} />
            <StatBox label="Growth Rate" value={growthRate} />
            <StatBox label="Competition" value={marketCondition.split(' ')[0]} sub={`${competitorsFound} found`} />
          </div>
        </CardContent>
      </Card>

      {signals?.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Market Signals
            </p>
            <ul className="space-y-2.5">
              {signals.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground/70">
                  <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 text-primary opacity-60" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {mainPatterns?.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Key Patterns
            </p>
            <ul className="space-y-2">
              {mainPatterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-[5px] h-[4px] w-[4px] shrink-0 rounded-full bg-border" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {topGap && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
              Top Opportunity Gap
            </p>
            <p className="text-sm font-semibold text-foreground mb-3">{topGap.title}</p>

            <Separator className="mb-3" />

            <dl className="space-y-1.5">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-[1px]">Currently</dt>
                <dd className="text-xs leading-snug text-muted-foreground">{topGap.currentMarket}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pt-[1px]">Missing</dt>
                <dd className="text-xs leading-snug text-muted-foreground">{topGap.missing}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
