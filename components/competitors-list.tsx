"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CompetitorAnalysis } from "@/types";

function CompetitorLogo({ domain, name }: { domain: string; name: string }) {
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
  const [dead, setDead] = useState(false);

  const fallbackStyle = { border: "1px solid var(--border)", backgroundColor: "var(--bg-subtle)", color: "var(--text-3)" };

  if (dead) {
    return (
      <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold uppercase select-none" style={fallbackStyle}>
        {name[0] ?? "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} alt=""
      className="h-10 w-10 shrink-0 rounded-xl object-contain p-1"
      style={fallbackStyle}
      onError={() => {
        if (src.includes("clearbit")) setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
        else setDead(true);
      }}
    />
  );
}

function CompetitorCard({ name, domain, url, strengths, weaknesses }: CompetitorAnalysis) {
  return (
    <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
      <div className="flex items-center gap-3 mb-4">
        <CompetitorLogo domain={domain} name={name} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--text-1)" }}>{name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-4)" }}>{domain}</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 transition-colors duration-150"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70 mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[11px] leading-snug" style={{ color: "var(--text-2)" }}>
                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-emerald-500/50" />{s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 mb-2">Weaknesses</p>
          <ul className="space-y-1.5">
            {weaknesses.map((w) => (
              <li key={w} className="flex items-start gap-2 text-[11px] leading-snug" style={{ color: "var(--text-2)" }}>
                <span className="mt-[4px] h-[3px] w-[3px] shrink-0 rounded-full bg-rose-500/50" />{w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function CompetitorsList({ competitors }: { competitors: CompetitorAnalysis[] }) {
  if (!competitors?.length) {
    return <p className="text-xs py-6 text-center" style={{ color: "var(--text-3)" }}>No competitor data available — analysis based on training knowledge</p>;
  }
  return (
    <div className="grid gap-3">
      {competitors.slice(0, 4).map((c) => <CompetitorCard key={c.url} {...c} />)}
    </div>
  );
}
