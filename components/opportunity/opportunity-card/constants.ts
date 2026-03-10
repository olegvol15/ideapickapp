import type { DifficultyLevel, SignalLevel } from '@/types';

export const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  Easy:   'text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:border-emerald-400/30',
  Medium: 'text-amber-600   border-amber-500/30   dark:text-amber-400   dark:border-amber-400/30',
  Hard:   'text-rose-600    border-rose-500/30    dark:text-rose-400    dark:border-rose-400/30',
};

export const SIGNAL_TAG: Record<SignalLevel, string> = {
  High:   'text-emerald-700 border-emerald-500/25 bg-emerald-50   dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
  Medium: 'text-amber-700   border-amber-500/25   bg-amber-50     dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]',
  Low:    'text-[#6d89a9]   border-[#023E8A]/15   bg-[#f0f7ff]   dark:text-[#4e6f8a]   dark:border-white/8        dark:bg-white/4',
};

export const COMPETITION_TAG: Record<SignalLevel, string> = {
  Low:    'text-emerald-700 border-emerald-500/25 bg-emerald-50  dark:text-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-400/[0.06]',
  Medium: 'text-amber-700   border-amber-500/25   bg-amber-50    dark:text-amber-400   dark:border-amber-400/20   dark:bg-amber-400/[0.06]',
  High:   'text-rose-600    border-rose-500/25    bg-rose-50     dark:text-rose-400    dark:border-rose-400/20    dark:bg-rose-400/[0.06]',
};
