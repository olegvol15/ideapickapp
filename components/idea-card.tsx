export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface Idea {
  title: string;
  description: string;
  problem: string;
  audience: string;
  tags: string[];
  difficulty: DifficultyLevel;
}

const difficultyStyles: Record<DifficultyLevel, string> = {
  Easy: "text-emerald-400 border-emerald-400/30",
  Medium: "text-amber-400 border-amber-400/30",
  Hard: "text-brand border-brand/40",
};

export function IdeaCard({ title, description, problem, audience, tags, difficulty }: Idea) {
  return (
    <div className="group rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-6 transition-all duration-200 hover:-translate-y-px hover:border-zinc-600/70 hover:shadow-[0_8px_32px_rgba(255,71,20,0.1),0_2px_8px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[15px] font-bold uppercase tracking-wide text-white">
          {title}
        </h3>
        <span
          className={`shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${difficultyStyles[difficulty]}`}
        >
          {difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">{description}</p>

      {/* Meta */}
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Problem
          </dt>
          <dd className="text-zinc-400">{problem}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Audience
          </dt>
          <dd className="text-zinc-400">{audience}</dd>
        </div>
      </dl>

      {/* Tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-brand/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
