'use client';

import { cn } from '@/lib/utils';

type IdeaPickLogoProps = {
  className?: string;
  compact?: boolean;
};

export function IdeaPickLogo({
  className,
  compact = false,
}: IdeaPickLogoProps) {
  return (
    <span
      className={cn(
        'font-display uppercase leading-none tracking-[0.25em] text-foreground',
        compact ? 'text-sm' : 'text-[1.05rem]',
        className,
      )}
    >
      IDEA<span className="text-primary">PICK</span>
    </span>
  );
}
