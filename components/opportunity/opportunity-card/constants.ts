import type { BadgeProps } from '@/components/ui/badge';
import type { DifficultyLevel, SignalLevel } from '@/types';

/** Badge variant for each difficulty level. */
export const DIFFICULTY_VARIANT: Record<
  DifficultyLevel,
  BadgeProps['variant']
> = {
  Easy: 'difficulty-easy',
  Medium: 'difficulty-medium',
  Hard: 'difficulty-hard',
};

/** Badge variant for demand / monetization signal levels. */
export const SIGNAL_VARIANT: Record<SignalLevel, BadgeProps['variant']> = {
  High: 'signal-high',
  Medium: 'signal-medium',
  Low: 'signal-low',
};

/** Badge variant for competition level (inverted — Low = good). */
export const COMPETITION_VARIANT: Record<SignalLevel, BadgeProps['variant']> = {
  Low: 'competition-low',
  Medium: 'competition-medium',
  High: 'competition-high',
};
