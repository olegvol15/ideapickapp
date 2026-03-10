import { TrendingUp, ArrowRight } from 'lucide-react';
import type { MarketContext, Gap } from '@/types';
import { ScoreBar } from './ScoreBar';
import { StatBox } from './StatBox';

interface MarketDashboardProps {
  marketContext: MarketContext;
  gaps: Gap[];
}

export function MarketDashboard({ marketContext, gaps }: MarketDashboardProps) {
  const {
    theme, marketCondition, opportunityScore,
    marketSize, growthRate, signals, mainPatterns, competitorsFound,
  } = marketContext;
  const topGap = gaps?.[0];

  return (
    <div className="space-y-4">

      {/* Overview */}
      <div className="rounded-xl p-5" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
            Market Overview
          </span>
          <span className="ml-auto text-[10px]" style={{ color: 'var(--text-4)' }}>
            {competitorsFound} sources
          </span>
        </div>

        <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-1)' }}>{theme}</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>{marketCondition}</p>

        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
              Opportunity Score
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>
              {opportunityScore}/100
            </span>
          </div>
          <ScoreBar value={opportunityScore} />
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <StatBox label="Market Size" value={marketSize} />
          <StatBox label="Growth Rate" value={growthRate} />
          <StatBox label="Competition" value={marketCondition.split(' ')[0]} sub={`${competitorsFound} found`} />
        </div>
      </div>

      {/* Signals */}
      {signals?.length > 0 && (
        <div className="rounded-xl p-5" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-3)' }}>
            Market Signals
          </p>
          <ul className="space-y-2.5">
            {signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: 'var(--accent)', opacity: 0.6 }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Patterns */}
      {mainPatterns?.length > 0 && (
        <div className="rounded-xl p-5" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-3)' }}>
            Key Patterns
          </p>
          <ul className="space-y-2">
            {mainPatterns.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                <span className="mt-[5px] h-[4px] w-[4px] shrink-0 rounded-full" style={{ backgroundColor: 'var(--border)' }} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Gap */}
      {topGap && (
        <div className="rounded-xl p-5" style={{ border: '1px solid var(--accent-hi)', backgroundColor: 'var(--accent-lo)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--accent)', opacity: 0.7 }}>
            Top Opportunity Gap
          </p>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>{topGap.title}</p>
          <dl className="space-y-1.5">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: 'var(--text-4)' }}>Currently</dt>
              <dd className="text-xs leading-snug" style={{ color: 'var(--text-3)' }}>{topGap.currentMarket}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-[9px] font-bold uppercase tracking-widest pt-[1px]" style={{ color: 'var(--text-4)' }}>Missing</dt>
              <dd className="text-xs leading-snug" style={{ color: 'var(--text-3)' }}>{topGap.missing}</dd>
            </div>
          </dl>
        </div>
      )}

    </div>
  );
}
