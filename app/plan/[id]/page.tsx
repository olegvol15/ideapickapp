"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Idea } from "@/types";
import { getPlan } from "@/services/storage.service";
import { computeOpportunityScore } from "@/lib/scoring";
import { RoadmapMap } from "@/components/roadmap/RoadmapMap";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PlanPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [idea,     setIdea]     = useState<Idea | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const found = getPlan(id);
    if (found) setIdea(found);
    else       setNotFound(true);
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Plan not found — go back and try again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-[10px] font-bold uppercase tracking-widest transition-colors"
            style={{ color: "var(--accent)" }}
          >
            ← Back to IdeaPick
          </button>
        </div>
      </div>
    );
  }

  if (!idea) return null;

  const score = computeOpportunityScore(idea);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--bg)", color: "var(--text-1)" }}>

      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 px-6 py-3 flex items-center gap-4 backdrop-blur-sm"
        style={{
          borderBottom:    "1px solid var(--border)",
          backgroundColor: "color-mix(in srgb, var(--bg) 90%, transparent)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="transition-colors"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-1)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-4)")}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: "var(--text-4)" }}>
            Build Roadmap
          </p>
          <h1 className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>
            {idea.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
            {idea.difficulty}
          </span>
          <span className="text-[10px] font-bold" style={{ color: "var(--text-4)" }}>
            <span className="text-sm" style={{ color: "var(--text-1)" }}>{score}</span>/10
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Pitch */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-6">
        <p className="text-sm leading-relaxed max-w-xl" style={{ color: "var(--text-2)" }}>
          {idea.pitch}
        </p>
      </div>

      {/* Mindmap */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        <RoadmapMap idea={idea} />
      </div>

      {/* Supporting blocks */}
      <div className="max-w-5xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {idea.techStack?.length > 0 && (
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--text-4)" }}>
              Suggested Stack
            </p>
            <div className="space-y-2">
              {idea.techStack.map((item) => (
                <div key={item.layer} className="flex items-baseline gap-2">
                  <span className="w-[72px] shrink-0 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
                    {item.layer}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-1)" }}>{item.tech}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {idea.firstUsers?.length > 0 && (
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--text-4)" }}>
              Find First Users
            </p>
            <ul className="space-y-2">
              {idea.firstUsers.map((u) => (
                <li key={u} className="flex items-start gap-2 text-xs leading-snug" style={{ color: "var(--text-2)" }}>
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent)", opacity: 0.5 }} />
                  {u}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--text-4)" }}>
            Why This Wins
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{idea.differentiation}</p>
          {idea.closestCompetitors?.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-4)" }}>
                Watch out for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {idea.closestCompetitors.map((c) => (
                  <span
                    key={c}
                    className="rounded px-2 py-0.5 text-[9px]"
                    style={{ border: "1px solid var(--border)", color: "var(--text-3)" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
