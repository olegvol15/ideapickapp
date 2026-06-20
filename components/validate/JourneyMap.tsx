'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { IdeaPickMascot } from '@/components/brand/IdeaPickMascot';
import { stepStatus } from '@/lib/validate/progress';
import type { Phase, StepId, StepStatus } from '@/lib/validate/progress';
import { JOURNEY_PATH, JOURNEY_VIEWBOX } from '@/lib/validate/journey-path';
import type { JourneyNodeId } from '@/lib/validate/journey-path';

interface JourneyMapProps {
  phase: Phase;
}

// How far short of the destination node the mascot parks while a phase is still
// running, so it crawls and waits instead of arriving early.
const PARK = 0.07;

const [, QUERIES_NODE, RESEARCH_NODE, SCORING_NODE] = JOURNEY_PATH.nodes;

function targetForPhase(phase: Phase): number {
  switch (phase) {
    case 'thinking':
      return Math.max(0, QUERIES_NODE.t - PARK);
    case 'researching':
      return RESEARCH_NODE.t - PARK;
    case 'analyzing':
      return SCORING_NODE.t - PARK;
  }
}

function nodeStatus(id: JourneyNodeId, phase: Phase): StepStatus {
  if (id === 'idea') return 'done';
  return stepStatus(id as StepId, phase);
}

export function JourneyMap({ phase }: JourneyMapProps) {
  const reduced = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const progress = useMotionValue(0);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, []);

  useEffect(() => {
    const controls = animate(
      progress,
      targetForPhase(phase),
      reduced
        ? { duration: 0 }
        : { duration: 16, ease: [0.16, 1, 0.3, 1] }
    );
    return () => controls.stop();
  }, [phase, reduced, progress]);

  const pointAt = (p: number) => {
    const el = pathRef.current;
    if (!el || !length) return QUERIES_NODE; // safe fallback before measurement
    return el.getPointAtLength(p * length);
  };

  const left = useTransform(progress, (p) => `${pointAt(p).x}%`);
  const top = useTransform(
    progress,
    (p) => `${(pointAt(p).y / JOURNEY_VIEWBOX.height) * 100}%`
  );

  return (
    <div className="relative mx-auto aspect-[100/48] max-h-[40vh] w-full max-w-3xl">
      <svg
        viewBox={`0 0 ${JOURNEY_VIEWBOX.width} ${JOURNEY_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          {/* Reveal mask: a solid stroke "drawn" via pathLength. Its solidness
              is invisible — it only gates which part of the dashed colored line
              shows, so the colored line keeps its own dash pattern. */}
          <mask id="journey-traveled">
            <motion.path
              d={JOURNEY_PATH.d}
              fill="none"
              stroke="white"
              strokeWidth={6}
              strokeLinecap="round"
              style={{ pathLength: progress }}
            />
          </mask>
        </defs>

        {/* Faint dashed treasure-map trail */}
        <path
          ref={pathRef}
          d={JOURNEY_PATH.d}
          fill="none"
          className="stroke-muted-foreground/30"
          strokeWidth={0.9}
          strokeDasharray="3 3.5"
          strokeLinecap="round"
        />
        {/* Same dashed line, recolored, revealed up to the mascot via the mask */}
        <path
          d={JOURNEY_PATH.d}
          fill="none"
          className="stroke-primary"
          strokeWidth={1}
          strokeDasharray="3 3.5"
          strokeLinecap="round"
          mask="url(#journey-traveled)"
        />

        {/* Stage flags */}
        {JOURNEY_PATH.nodes.map((node) => (
          <Flag
            key={node.id}
            x={node.x}
            y={node.y}
            status={nodeStatus(node.id, phase)}
          />
        ))}
      </svg>

      {/* Node labels (HTML for crisp typography) */}
      {JOURNEY_PATH.nodes.map((node) => {
        const status = nodeStatus(node.id, phase);
        return (
          <span
            key={node.id}
            className={cn(
              'pointer-events-none absolute max-w-[8rem] -translate-x-1/2 -translate-y-1/2 rounded bg-background/85 px-1.5 py-0.5 text-center text-sm font-medium leading-tight backdrop-blur-sm transition-colors duration-500',
              status === 'active' && 'text-foreground/90',
              status === 'done' && 'text-foreground/35',
              status === 'pending' && 'text-muted-foreground/30'
            )}
            style={{
              left: `${node.x + node.labelDx}%`,
              top: `${((node.y + node.labelDy) / JOURNEY_VIEWBOX.height) * 100}%`,
            }}
          >
            {node.label}
          </span>
        );
      })}

      {/* Walking mascot — feet on the trail, body floating above it */}
      <motion.div
        className="absolute z-10 -translate-x-1/2 -translate-y-full"
        style={{ left, top }}
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, -2, 0], rotate: [0, -2, 0, 2, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
          className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
        >
          <IdeaPickMascot background={false} className="h-14 w-14" />
        </motion.div>
      </motion.div>
    </div>
  );
}

interface FlagProps {
  x: number;
  y: number;
  status: StepStatus;
}

const POLE_HEIGHT = 4.5;

// A planted treasure-map flag: a pole rising from the trail point with a
// triangular pennant, colored by status.
function Flag({ x, y, status }: FlagProps) {
  const poleTop = y - POLE_HEIGHT;
  const pennant = status === 'done' ? 'fill-emerald-400' : status === 'active' ? 'fill-primary' : 'fill-muted-foreground/30';
  const nub = status === 'pending' ? 'fill-muted-foreground/40' : pennant;

  return (
    <g>
      {status === 'active' && (
        <motion.circle
          cx={x}
          cy={y}
          className="fill-primary/30"
          initial={{ r: 2, opacity: 0.6 }}
          animate={{ r: [2, 5.5, 2], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
        />
      )}
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={poleTop}
        className="stroke-muted-foreground/50"
        strokeWidth={0.6}
        strokeLinecap="round"
      />
      <path
        d={`M ${x} ${poleTop} L ${x + 5} ${poleTop + 1.6} L ${x} ${poleTop + 3.2} Z`}
        className={pennant}
      />
      <circle cx={x} cy={y} r={1} className={nub} />
    </g>
  );
}
