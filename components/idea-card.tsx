import type { Idea, DifficultyLevel, SignalLevel } from "@/types";

export type { Idea, DifficultyLevel };

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const difficultyStyles: Record<DifficultyLevel, string> = {
  Easy: "text-emerald-400 border-emerald-400/30",
  Medium: "text-amber-400 border-amber-400/30",
  Hard: "text-brand border-brand/40",
};

// ─── Signal badge ─────────────────────────────────────────────────────────────

const demandStyles: Record<SignalLevel, string> = {
  High: "text-emerald-400 border-emerald-400/25 bg-emerald-400/5",
  Medium: "text-amber-400 border-amber-400/25 bg-amber-400/5",
  Low: "text-zinc-500 border-zinc-700 bg-zinc-900",
};

// Competition is inverted: Low competition = good
const competitionStyles: Record<SignalLevel, string> = {
  Low: "text-emerald-400 border-emerald-400/25 bg-emerald-400/5",
  Medium: "text-amber-400 border-amber-400/25 bg-amber-400/5",
  High: "text-brand border-brand/25 bg-brand/5",
};

function SignalBadge({
  label,
  value,
  styles,
}: {
  label: string;
  value: SignalLevel;
  styles: Record<SignalLevel, string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{label}</span>
      <span
        className={`w-fit rounded-sm border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${styles[value]}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Meta row ─────────────────────────────────────────────────────────────────

const META_LABEL = "shrink-0 w-20 text-[10px] font-bold uppercase tracking-widest text-zinc-600";
const META_VALUE = "text-xs text-zinc-400 leading-snug";

// ─── Main component ───────────────────────────────────────────────────────────

export function IdeaCard({
  title,
  pitch,
  audience,
  problem,
  gap,
  differentiation,
  closestCompetitors,
  mvpFeatures,
  difficulty,
  marketDemand,
  competitionLevel,
  monetizationPotential,
  confidence,
}: Idea) {
  return (
    <div className="group rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-6 transition-all duration-200 hover:-translate-y-px hover:border-zinc-600/70 hover:shadow-[0_8px_32px_rgba(255,71,20,0.1),0_2px_8px_rgba(0,0,0,0.4)]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[15px] font-bold uppercase tracking-wide text-white leading-snug">
          {title}
        </h3>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${difficultyStyles[difficulty]}`}
          >
            {difficulty}
          </span>
          <span className="text-[10px] text-zinc-600">
            {confidence}% confidence
          </span>
        </div>
      </div>

      {/* Pitch */}
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">{pitch}</p>

      {/* Meta */}
      <dl className="mt-4 space-y-2">
        <div className="flex gap-3">
          <dt className={META_LABEL}>Problem</dt>
          <dd className={META_VALUE}>{problem}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={META_LABEL}>Audience</dt>
          <dd className={META_VALUE}>{audience}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={META_LABEL}>Gap</dt>
          <dd className={META_VALUE}>{gap}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={META_LABEL}>Edge</dt>
          <dd className={META_VALUE}>{differentiation}</dd>
        </div>
      </dl>

      {/* Closest competitors */}
      {closestCompetitors?.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Competes with
          </span>
          {closestCompetitors.map((c) => (
            <span
              key={c}
              className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* MVP Features */}
      {mvpFeatures?.length > 0 && (
        <div className="mt-4 border-t border-zinc-800/60 pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            MVP Features
          </p>
          <ul className="space-y-1">
            {mvpFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="mt-1.5 h-[4px] w-[4px] shrink-0 rounded-full bg-brand/50" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scoring signals */}
      <div className="mt-4 border-t border-zinc-800/60 pt-4 flex flex-wrap gap-4">
        <SignalBadge label="Demand" value={marketDemand} styles={demandStyles} />
        <SignalBadge label="Competition" value={competitionLevel} styles={competitionStyles} />
        <SignalBadge label="Monetization" value={monetizationPotential} styles={demandStyles} />
      </div>
    </div>
  );
}
