import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanSectionAccent = 'brand' | 'amber' | 'emerald';

interface PlanSectionHeaderProps {
  icon: LucideIcon;
  label: string;
  accent: PlanSectionAccent;
}

const ACCENT_CHIP: Record<PlanSectionAccent, string> = {
  brand: 'bg-brand/10 text-brand',
  amber: 'bg-amber-400/10 text-amber-400',
  emerald: 'bg-emerald-400/10 text-emerald-400',
};

export function PlanSectionHeader({
  icon: Icon,
  label,
  accent,
}: PlanSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          ACCENT_CHIP[accent]
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </div>
  );
}
