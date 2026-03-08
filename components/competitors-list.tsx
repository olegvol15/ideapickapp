"use client";

import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Competitor } from "@/types";

const COLLAPSED_COUNT = 5;

function CompetitorRow({ name, url, snippet, source }: Competitor) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800/40 last:border-0">
      <span className="mt-0.5 shrink-0 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
        {source}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-300 leading-snug line-clamp-1">{name}</p>
        <p className="mt-0.5 text-[11px] text-zinc-600 leading-relaxed line-clamp-1">{snippet}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 shrink-0 text-zinc-700 hover:text-brand transition-colors duration-150"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export function CompetitorsList({ competitors }: { competitors: Competitor[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!competitors.length) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-5 py-6 flex items-center gap-3">
        <Globe className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
        <p className="text-xs text-zinc-600">No web sources — analysis based on training knowledge</p>
      </div>
    );
  }

  const chips = competitors.slice(0, COLLAPSED_COUNT);
  const extra = competitors.length - COLLAPSED_COUNT;

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">

      {/* Compact source chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {chips.map((c) => (
          <a
            key={c.url}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors duration-150"
          >
            {c.source}
          </a>
        ))}
        {extra > 0 && (
          <span className="text-[10px] text-zinc-600">+{extra} more</span>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-brand transition-colors duration-150"
      >
        {expanded ? "Hide sources" : "View all sources →"}
      </button>

      {/* Full list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="full"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-zinc-800/40 pt-1">
              {competitors.map((c) => (
                <CompetitorRow key={c.url} {...c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
