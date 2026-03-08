"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Competitor } from "@/types";

const INITIAL_COUNT = 5;

// ─── Logo with Clearbit → Google Favicons → Letter fallback ──────────────────

function CompetitorLogo({ url, name }: { url: string; name: string }) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
  const [dead, setDead] = useState(false);

  if (dead) {
    return (
      <div className="h-9 w-9 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-400 uppercase select-none">
        {name[0] ?? "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-9 w-9 shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 object-contain p-0.5"
      onError={() => {
        if (src.includes("clearbit")) {
          setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        } else {
          setDead(true);
        }
      }}
    />
  );
}

// ─── Single competitor row ────────────────────────────────────────────────────

function CompetitorItem({ name, url, source }: Competitor) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800/40 last:border-0">
      <CompetitorLogo url={url} name={name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200 leading-snug line-clamp-1">{name}</p>
        <p className="text-[11px] text-zinc-600 mt-0.5">{source}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-zinc-700 hover:text-brand transition-colors duration-150"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function CompetitorsList({ competitors }: { competitors: Competitor[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!competitors.length) {
    return (
      <p className="text-xs text-zinc-600 py-4 text-center">
        No web sources found — analysis based on training knowledge
      </p>
    );
  }

  const visible = showAll ? competitors : competitors.slice(0, INITIAL_COUNT);
  const hidden = competitors.length - INITIAL_COUNT;

  return (
    <div>
      <div>
        {visible.map((c) => (
          <CompetitorItem key={c.url} {...c} />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {showAll && hidden > 0 && (
          <motion.div
            key="extra"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {competitors.slice(INITIAL_COUNT).map((c) => (
              <CompetitorItem key={c.url} {...c} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {hidden > 0 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-brand transition-colors duration-150"
        >
          {showAll ? "Show less" : `+ Show all ${competitors.length} sources`}
        </button>
      )}
    </div>
  );
}
