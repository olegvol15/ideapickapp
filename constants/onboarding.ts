export const LOADING_MESSAGES = [
  'Mapping the competitive landscape…',
  'Identifying market signals…',
  'Running risk analysis…',
  'Calculating opportunity score…',
  'Finalizing verdict…',
];

export const fieldInput =
  'bg-[#141414] border border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-0 focus-visible:border-white/[0.22] transition-colors text-sm';

export const slide = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.2 },
};

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.28 },
};
