import { ExternalLink, Globe } from "lucide-react";
import type { Competitor } from "@/types";

function CompetitorRow({ name, url, snippet, source }: Competitor) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
      <span className="mt-0.5 shrink-0 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
        {source}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-300 leading-snug line-clamp-1">{name}</p>
        <p className="mt-0.5 text-[11px] text-zinc-600 leading-relaxed line-clamp-2">{snippet}</p>
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
  if (!competitors.length) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-5 py-8 text-center">
        <Globe className="h-4 w-4 text-zinc-700 mx-auto mb-2" />
        <p className="text-xs text-zinc-600">No web sources found — ideas based on training knowledge</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-5 py-1">
      {competitors.map((c) => (
        <CompetitorRow key={c.url} {...c} />
      ))}
    </div>
  );
}
