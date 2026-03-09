import { Skeleton } from "@/components/ui/skeleton";

const TAB_LABELS = ["Opportunities", "Market", "Competitors"] as const;

export function ResearchSkeletons() {
  return (
    <div>
      {/* Skeleton tab bar */}
      <div className="flex mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {TAB_LABELS.map((label, i) => (
          <div
            key={label}
            className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: i === 0 ? "var(--accent)" : "var(--text-4)",
              borderBottom: i === 0 ? "2px solid var(--accent)" : undefined,
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Skeleton cards */}
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
            <Skeleton className="h-3 w-3/4 mb-3" />
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Skeleton className="h-3 w-14 shrink-0" />
                <Skeleton className="h-3 flex-1" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-3 w-14 shrink-0" />
                <Skeleton className="h-3 flex-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
