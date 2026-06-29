'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextMovesRoadmapProps {
  moves: string[];
}

const EASE = [0.16, 1, 0.3, 1] as const;
const STAGGER = 0.08;

// Shared grid: [node | card] on mobile, [left card | node | right card] on sm+.
const ROW = 'relative grid grid-cols-[2rem_1fr] items-center gap-x-4 sm:grid-cols-[1fr_2rem_1fr]';
const NODE = 'z-10 col-start-1 flex h-8 w-8 items-center justify-center justify-self-center rounded-full sm:col-start-2';

export function NextMovesRoadmap({ moves }: NextMovesRoadmapProps) {
  const reduced = useReducedMotion();

  return (
    <div className="relative py-1">
      {/* Dashed treasure-trail spine — left on mobile, center on sm+ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-4 left-4 w-px border-l border-dashed border-brand/30 sm:left-1/2 sm:-translate-x-1/2"
      />

      <ol className="flex flex-col gap-3">
        {moves.map((move, index) => {
          const left = index % 2 === 0;
          return (
            <motion.li
              key={move}
              className={ROW}
              initial={reduced ? false : { opacity: 0, y: 10, x: left ? -12 : 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.4, delay: index * STAGGER, ease: EASE }}
            >
              <span
                className={cn(
                  NODE,
                  'border border-brand/40 bg-brand text-sm font-bold tabular-nums text-white'
                )}
              >
                {index + 1}
              </span>
              <div
                className={cn(
                  'col-start-2 rounded-xl border border-border bg-card/60 p-3.5 text-[15px] leading-relaxed text-foreground/85 transition-colors hover:bg-card',
                  left ? 'sm:col-start-1 sm:text-right' : 'sm:col-start-3'
                )}
              >
                {move}
              </div>
            </motion.li>
          );
        })}

        {/* Destination flag — the goal the moves drive toward */}
        <motion.li
          className={ROW}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: moves.length * STAGGER, ease: EASE }}
        >
          <span
            className={cn(
              NODE,
              'border border-emerald-400/40 bg-background text-emerald-400'
            )}
          >
            <Flag className="h-4 w-4" />
          </span>
          <p className="col-start-2 text-sm font-semibold text-foreground sm:col-start-3">
            Destination
            <span className="ml-1.5 font-normal text-muted-foreground/70">
              validated demand
            </span>
          </p>
        </motion.li>
      </ol>
    </div>
  );
}
