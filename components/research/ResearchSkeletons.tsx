import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TAB_LABELS = ['Opportunities', 'Market', 'Competitors'] as const;

export function ResearchSkeletons() {
  return (
    <div>
      <div className="flex border-b border-border mb-6">
        {TAB_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest',
              i === 0 ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground/60',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
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
