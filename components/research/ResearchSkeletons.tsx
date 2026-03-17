'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TAB_LABELS = ['Opportunities', 'Market', 'Competitors'] as const;

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4 mb-4" />
      <div className="space-y-2.5 mb-5">
        <div className="flex gap-2">
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-3 flex-1" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </motion.div>
  );
}

export function ResearchSkeletons() {
  return (
    <div>
      <div className="flex border-b border-border mb-6">
        {TAB_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest',
              i === 0
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground/60'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <SkeletonCard delay={0} />
        <SkeletonCard delay={0.12} />
        <SkeletonCard delay={0.24} />
      </div>
    </div>
  );
}
