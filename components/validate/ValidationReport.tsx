import { ScoreBar } from '@/components/market/market-dashboard/ScoreBar';
import { CompetitorsList } from '@/components/market/competitors-list';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

interface ValidationReportProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Strong';
  if (score >= 45) return 'Moderate';
  return 'Weak';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
  if (score >= 45) return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
  return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
}

export function ValidationReport({ result, competitors }: ValidationReportProps) {
  const { score, painScore, competitionScore, opportunityScore, signals, risks, verdict } = result;

  return (
    <div className="flex flex-col gap-6">
      {/* Overall score */}
      <div
        className={`flex items-center gap-5 rounded-xl border px-6 py-5 ${getScoreBg(score)}`}
      >
        <div className="text-5xl font-bold tabular-nums">{score}</div>
        <div>
          <p className="text-lg font-semibold">{getScoreLabel(score)}</p>
          <p className="text-sm opacity-70">Overall viability score</p>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pain Evidence', value: painScore },
          { label: 'Competition', value: competitionScore },
          { label: 'Opportunity', value: opportunityScore },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col rounded-lg border border-border bg-card px-4 py-3"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {label}
            </span>
            <span className="mt-1 text-xl font-bold tabular-nums text-foreground">{value}</span>
            <ScoreBar value={value} />
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="rounded-lg border border-border bg-card px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Verdict
        </p>
        <p className="text-sm leading-relaxed text-foreground/80">{verdict}</p>
      </div>

      {/* Signals */}
      {signals.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-3">
            Positive Signals
          </p>
          <ul className="flex flex-col gap-2">
            {signals.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70 mb-3">
            Risks
          </p>
          <ul className="flex flex-col gap-2">
            {risks.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Web competitors */}
      {competitors.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
            Market Signals from the Web
          </p>
          <CompetitorsList competitors={competitors} analyzed={[]} />
        </div>
      )}
    </div>
  );
}
