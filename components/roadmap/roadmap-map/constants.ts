export const BRANCH_STYLE = {
  build: {
    border: 'border-emerald-500/25',
    bg:     'bg-emerald-50 dark:bg-emerald-500/[0.04]',
    label:  'text-emerald-600/80 dark:text-emerald-400/80',
    dot:    'bg-emerald-500/40',
    stroke: '#10b981',
  },
  features: {
    border: 'border-amber-500/25',
    bg:     'bg-amber-50 dark:bg-amber-500/[0.04]',
    label:  'text-amber-600/80 dark:text-amber-400/80',
    dot:    'bg-amber-500/40',
    stroke: '#f59e0b',
  },
  users: {
    border: 'border-[var(--border)]',
    bg:     'bg-[var(--bg-subtle)]',
    label:  'text-[var(--accent)]',
    dot:    'bg-[var(--accent)]/40',
    stroke: '#0077b6',
  },
  stack: {
    border: 'border-violet-500/25',
    bg:     'bg-violet-50 dark:bg-violet-500/[0.04]',
    label:  'text-violet-600/80 dark:text-violet-400/80',
    dot:    'bg-violet-500/40',
    stroke: '#7c3aed',
  },
} as const;

export type BranchId = keyof typeof BRANCH_STYLE;

export interface Branch {
  id:    BranchId;
  label: string;
  items: string[];
  side:  'left' | 'right';
}

export interface PathEntry {
  d:      string;
  stroke: string;
}
