import type { Gap } from "@/types";

const ROW_LABEL = "w-20 shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-600";
const ROW_VALUE = "text-xs text-zinc-400 leading-relaxed";

export function GapCard({ gap }: { gap: Gap }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand/80 mb-3">
        {gap.title}
      </p>
      <dl className="space-y-2">
        <div className="flex gap-3">
          <dt className={ROW_LABEL}>Currently</dt>
          <dd className={ROW_VALUE}>{gap.currentMarket}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={ROW_LABEL}>Missing</dt>
          <dd className={ROW_VALUE}>{gap.missing}</dd>
        </div>
        <div className="flex gap-3">
          <dt className={ROW_LABEL}>Why now</dt>
          <dd className={ROW_VALUE}>{gap.opportunity}</dd>
        </div>
      </dl>
    </div>
  );
}
