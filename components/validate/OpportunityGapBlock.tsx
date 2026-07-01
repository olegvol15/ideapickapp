import { IdeaPickMascot } from '@/components/brand/IdeaPickMascot';
import type { OpportunityGap } from '@/lib/schemas';

interface OpportunityGapBlockProps {
  gap: OpportunityGap;
}

export function OpportunityGapBlock({ gap }: OpportunityGapBlockProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.10] via-card/50 to-card/60 p-5">
      {/* Soft glow to make the opportunity read as the report's bright spot. */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl" />

      {/* Right gutter keeps the text clear of Idy in the bottom-right corner. */}
      <div className="relative flex flex-col gap-4 pr-24 sm:pr-28">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300/90">
            The opening
          </span>
          <span className="text-[11px] text-muted-foreground/50">
            Idy&rsquo;s read on where the incumbents leave the door open
          </span>
        </div>

        <p className="text-[15px] font-semibold leading-relaxed text-foreground">
          {gap.headline}
        </p>

        {gap.openings.length > 0 && (
          <ul className="flex flex-col gap-2">
            {gap.openings.map((opening, index) => (
              <li
                key={opening}
                className="flex items-start gap-3 rounded-lg border border-violet-500/10 bg-violet-500/[0.05] p-3 transition-colors hover:border-violet-500/25 hover:bg-violet-500/[0.08]"
              >
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[11px] font-bold tabular-nums text-violet-300">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-foreground/85">
                  {opening}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <IdeaPickMascot
        background={false}
        className="pointer-events-none absolute bottom-3 right-3 h-20 w-20 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24"
      />
    </div>
  );
}
