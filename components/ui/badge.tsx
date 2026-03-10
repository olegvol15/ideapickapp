import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:
          'border-border text-foreground',
        // ── Signal variants (used in opportunity cards) ──
        'signal-high':
          'text-emerald-700 border-emerald-500/25 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
        'signal-medium':
          'text-amber-700 border-amber-500/25 bg-amber-50 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/[0.06]',
        'signal-low':
          'text-muted-foreground border-border bg-muted',
        'competition-low':
          'text-emerald-700 border-emerald-500/25 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
        'competition-medium':
          'text-amber-700 border-amber-500/25 bg-amber-50 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/[0.06]',
        'competition-high':
          'text-rose-600 border-rose-500/25 bg-rose-50 dark:text-rose-400 dark:border-rose-400/20 dark:bg-rose-400/[0.06]',
        'difficulty-easy':
          'text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30',
        'difficulty-medium':
          'text-amber-600 border-amber-500/30 dark:text-amber-400 dark:border-amber-400/30',
        'difficulty-hard':
          'text-rose-600 border-rose-500/30 dark:text-rose-400 dark:border-rose-400/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
