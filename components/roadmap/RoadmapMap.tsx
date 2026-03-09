"use client";

import { useRef, useLayoutEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Idea } from "@/types";

// ─── Branch config ─────────────────────────────────────────────────────────────

const BRANCH_STYLE = {
  build:    { border: "border-emerald-500/25", bg: "bg-emerald-50 dark:bg-emerald-500/[0.04]",  label: "text-emerald-600/80 dark:text-emerald-400/80", dot: "bg-emerald-500/40", stroke: "#10b981" },
  features: { border: "border-amber-500/25",   bg: "bg-amber-50 dark:bg-amber-500/[0.04]",      label: "text-amber-600/80 dark:text-amber-400/80",     dot: "bg-amber-500/40",   stroke: "#f59e0b" },
  users:    { border: "border-[var(--border)]", bg: "bg-[var(--bg-subtle)]",                     label: "text-[var(--accent)]",                         dot: "bg-[var(--accent)]/40", stroke: "#0077b6" },
  stack:    { border: "border-violet-500/25",   bg: "bg-violet-50 dark:bg-violet-500/[0.04]",   label: "text-violet-600/80 dark:text-violet-400/80",   dot: "bg-violet-500/40",  stroke: "#7c3aed" },
} as const;

type BranchId = keyof typeof BRANCH_STYLE;

interface Branch {
  id:    BranchId;
  label: string;
  items: string[];
  side:  "left" | "right";
}

interface PathEntry {
  d:      string;
  stroke: string;
}

// ─── Branch node ───────────────────────────────────────────────────────────────

interface BranchNodeProps {
  branch: Branch;
  align:  "left" | "right";
}

function BranchNode({ branch, align }: BranchNodeProps) {
  const s       = BRANCH_STYLE[branch.id];
  const isRight = align === "right";

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} px-4 py-3 w-[188px]`}>
      <p className={`text-[8px] font-bold uppercase tracking-widest ${s.label} mb-2 ${isRight ? "text-right" : ""}`}>
        {branch.label}
      </p>
      <ul className={`space-y-1 ${isRight ? "flex flex-col items-end" : ""}`}>
        {branch.items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-1.5 text-[10px] leading-snug ${isRight ? "flex-row-reverse" : ""}`}
            style={{ color: "var(--text-2)" }}
          >
            <span className={`mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full ${s.dot}`} />
            <span className="leading-[1.4]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface RoadmapMapProps {
  idea: Idea;
}

export function RoadmapMap({ idea }: RoadmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef    = useRef<HTMLDivElement>(null);
  const branchRefs   = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [paths,   setPaths]   = useState<PathEntry[]>([]);

  const branches = useMemo<Branch[]>(() => [
    { id: "build",    label: "Build Steps",  items: (idea.mvpRoadmap  ?? []).slice(0, 4).map((s) => s.replace(/^Step\s*\d+:\s*/i, "")), side: "left"  },
    { id: "features", label: "Core Product", items: (idea.mvpFeatures ?? []).slice(0, 3),                                                side: "left"  },
    { id: "users",    label: "First Users",  items: (idea.firstUsers  ?? []).slice(0, 3),                                                side: "right" },
    { id: "stack",    label: "Tech Stack",   items: (idea.techStack   ?? []).slice(0, 4).map((s) => `${s.layer}: ${s.tech}`),            side: "right" },
  ], [idea]);

  useLayoutEffect(() => {
    function computePaths() {
      const container = containerRef.current;
      const center    = centerRef.current;
      if (!container || !center) return;

      const cRect = container.getBoundingClientRect();
      const nRect = center.getBoundingClientRect();

      setSvgSize({ w: cRect.width, h: cRect.height });

      const cy = nRect.top - cRect.top + nRect.height / 2;
      const newPaths: PathEntry[] = [];

      branchRefs.current.forEach((el, i) => {
        if (!el) return;
        const bRect  = el.getBoundingClientRect();
        const by     = bRect.top  - cRect.top  + bRect.height / 2;
        const bx     = bRect.left - cRect.left + bRect.width  / 2;
        const isLeft = bx < (nRect.left - cRect.left + nRect.width / 2);

        const startX = isLeft ? nRect.left  - cRect.left : nRect.right - cRect.left;
        const endX   = isLeft ? bRect.right - cRect.left : bRect.left  - cRect.left;
        const midX   = (startX + endX) / 2;

        newPaths.push({
          d:      `M ${startX} ${cy} C ${midX} ${cy}, ${midX} ${by}, ${endX} ${by}`,
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

  const leftBranches  = branches.filter((b) => b.side === "left");
  const rightBranches = branches.filter((b) => b.side === "right");

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ minHeight: 460, border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}
    >
      {/* SVG bezier connectors */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={svgSize.w}
        height={svgSize.h}
        style={{ zIndex: 1 }}
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
            transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Centre MVP node */}
      <div
        ref={centerRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ zIndex: 10 }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-2xl px-5 py-4 text-center"
          style={{ minWidth: 156, border: "2px solid var(--accent-hi)", backgroundColor: "var(--accent-lo)" }}
        >
          <p className="text-[7px] font-bold uppercase tracking-[0.25em] mb-1.5" style={{ color: "var(--accent)", opacity: 0.6 }}>
            MVP
          </p>
          <p className="text-[13px] font-bold leading-snug" style={{ color: "var(--text-1)" }}>
            {idea.title.split(/\s*[—–-]\s*/)[0].trim()}
          </p>
          <div className="mt-2.5 h-px" style={{ backgroundColor: "var(--border)" }} />
          <p className="mt-1.5 text-[9px]" style={{ color: "var(--text-4)" }}>
            {idea.difficulty} · {idea.marketDemand} demand
          </p>
        </motion.div>
      </div>

      {/* Left branches */}
      <div className="absolute top-0 bottom-0 left-6 flex flex-col justify-around py-10" style={{ zIndex: 10 }}>
        {leftBranches.map((branch, i) => (
          <motion.div
            key={branch.id}
            ref={(el) => { branchRefs.current[i] = el; }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <BranchNode branch={branch} align="left" />
          </motion.div>
        ))}
      </div>

      {/* Right branches */}
      <div className="absolute top-0 bottom-0 right-6 flex flex-col justify-around py-10" style={{ zIndex: 10 }}>
        {rightBranches.map((branch, i) => (
          <motion.div
            key={branch.id}
            ref={(el) => { branchRefs.current[leftBranches.length + i] = el; }}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          >
            <BranchNode branch={branch} align="right" />
          </motion.div>
        ))}
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          zIndex: 0,
        }}
      />
    </div>
  );
}
