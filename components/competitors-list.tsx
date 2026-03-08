"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CompetitorAnalysis } from "@/types";

// ─── Logo with Clearbit → Google Favicons → Letter fallback ──────────────────

function CompetitorLogo({ domain, name }: { domain: string; name: string }) {
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
  const [dead, setDead] = useState(false);

  if (dead) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-400 uppercase select-none">
        {name[0] ?? "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-10 w-10 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 object-contain p-1"
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

// ─── Single competitor card ───────────────────────────────────────────────────

function CompetitorCard({ name, domain, url, strengths, weaknesses }: CompetitorAnalysis) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <CompetitorLogo domain={domain} name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-200 leading-snug">{name}</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">{domain}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-zinc-700 hover:text-brand transition-colors duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-snug">
                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-brand/70 mb-2">Weaknesses</p>
          <ul className="space-y-1.5">
            {weaknesses.map((w) => (
              <li key={w} className="flex items-start gap-2 text-[11px] text-zinc-400 leading-snug">
                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-brand/50" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function CompetitorsList({ competitors }: { competitors: CompetitorAnalysis[] }) {
  if (!competitors?.length) {
    return (
      <p className="text-xs text-zinc-600 py-6 text-center">
        No competitor data available — analysis based on training knowledge
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {competitors.slice(0, 4).map((c) => (
        <CompetitorCard key={c.url} {...c} />
      ))}
    </div>
  );
}
