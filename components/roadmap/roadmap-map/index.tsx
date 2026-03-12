'use client';

import { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Idea } from '@/types';
import { BRANCH_STYLE, type Branch, type PathEntry } from './constants';
import { BranchNode } from './BranchNode';

interface RoadmapMapProps {
  idea: Idea;
}

export function RoadmapMap({ idea }: RoadmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<PathEntry[]>([]);

  const branches = useMemo<Branch[]>(
    () => [
      {
        id: 'build',
        label: 'Build Steps',
        items: (idea.mvpRoadmap ?? [])
          .slice(0, 4)
          .map((s) => s.replace(/^Step\s*\d+:\s*/i, '')),
        side: 'left',
      },
      {
        id: 'features',
        label: 'Core Product',
        items: (idea.mvpFeatures ?? []).slice(0, 3),
        side: 'left',
      },
      {
        id: 'users',
        label: 'First Users',
        items: (idea.firstUsers ?? []).slice(0, 3),
        side: 'right',
      },
      {
        id: 'stack',
        label: 'Tech Stack',
        items: (idea.techStack ?? [])
          .slice(0, 4)
          .map((s) => `${s.layer}: ${s.tech}`),
        side: 'right',
      },
    ],
    [idea]
  );

  useLayoutEffect(() => {
    function computePaths() {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;

      const cRect = container.getBoundingClientRect();
      const nRect = center.getBoundingClientRect();
      setSvgSize({ w: cRect.width, h: cRect.height });

      const cy = nRect.top - cRect.top + nRect.height / 2;
      const newPaths: PathEntry[] = [];

      branchRefs.current.forEach((el, i) => {
        if (!el) return;
        const bRect = el.getBoundingClientRect();
        const bx = bRect.left - cRect.left + bRect.width / 2;
        const by = bRect.top - cRect.top + bRect.height / 2;
        const isLeft = bx < nRect.left - cRect.left + nRect.width / 2;
        const startX = isLeft
          ? nRect.left - cRect.left
          : nRect.right - cRect.left;
        const endX = isLeft
          ? bRect.right - cRect.left
          : bRect.left - cRect.left;
        const midX = (startX + endX) / 2;

        newPaths.push({
          d: `M ${startX} ${cy} C ${midX} ${cy}, ${midX} ${by}, ${endX} ${by}`,
          stroke: BRANCH_STYLE[branches[i].id].stroke,
        });
      });

      setPaths(newPaths);
    }

    computePaths();
    const ro = new ResizeObserver(computePaths);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [branches]);

  const leftBranches = branches.filter((b) => b.side === 'left');
  const rightBranches = branches.filter((b) => b.side === 'right');

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[460px] rounded-2xl border border-border bg-card overflow-hidden"
    >
      <svg
        className="absolute inset-0 pointer-events-none z-[1]"
        width={svgSize.w}
        height={svgSize.h}
      >
        {paths.map((p, i) => (
          <motion.path
            key={i}
            d={p.d}
            fill="none"
            stroke={p.stroke}
            strokeWidth={1.5}
            strokeOpacity={0.25}
            strokeDasharray="5 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.3 + i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      <div
        ref={centerRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="min-w-[156px] rounded-2xl border-2 border-primary/20 bg-primary/[0.06] px-5 py-4 text-center"
        >
          <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-primary opacity-60 mb-1.5">
            MVP
          </p>
          <p className="text-[13px] font-bold leading-snug text-foreground">
            {idea.title.split(/\s*[—–-]\s*/)[0].trim()}
          </p>
          <div className="mt-2.5 h-px bg-border" />
          <p className="mt-1.5 text-[9px] text-muted-foreground/60">
            {idea.difficulty} · {idea.marketDemand} demand
          </p>
        </motion.div>
      </div>

      <div className="absolute top-0 bottom-0 left-6 z-10 flex flex-col justify-around py-10">
        {leftBranches.map((branch, i) => (
          <motion.div
            key={branch.id}
            ref={(el) => {
              branchRefs.current[i] = el;
            }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <BranchNode branch={branch} align="left" />
          </motion.div>
        ))}
      </div>

      <div className="absolute top-0 bottom-0 right-6 z-10 flex flex-col justify-around py-10">
        {rightBranches.map((branch, i) => (
          <motion.div
            key={branch.id}
            ref={(el) => {
              branchRefs.current[leftBranches.length + i] = el;
            }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <BranchNode branch={branch} align="right" />
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 bg-dot-grid" />
    </div>
  );
}
