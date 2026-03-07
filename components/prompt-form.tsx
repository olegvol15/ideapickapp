"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { IdeaCard, type Idea, type DifficultyLevel } from "@/components/idea-card";
import { Skeleton } from "@/components/ui/skeleton";

export type ProductType = "SaaS" | "AI Tool" | "Chrome Extension" | "Dev Tool";
export type Difficulty = "Easy" | "Medium" | "Hard";
type Phase = "idle" | "thinking" | "generating" | "streaming";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_IDEAS: Idea[] = [
  {
    title: "DevLog — Automated Progress Reports",
    description:
      "Analyzes GitHub commits, PRs, and Jira tickets to auto-generate readable weekly summaries for engineering teams — no meetings required.",
    problem: "Developers spend hours writing status updates that nobody reads carefully.",
    audience: "Engineering managers and remote dev teams.",
    tags: ["SaaS", "Dev Tool"],
    difficulty: "Medium",
  },
  {
    title: "StackMatch — Job Fit Analyzer",
    description:
      "A Chrome extension that scans job postings and highlights skill gaps in real time, then suggests targeted resources to close them fast.",
    problem: "Developers apply to roles without knowing exactly what skills they're missing.",
    audience: "Junior to mid-level developers actively job hunting.",
    tags: ["Chrome Extension", "AI Tool"],
    difficulty: "Easy",
  },
  {
    title: "PairAI — AI Code Review Assistant",
    description:
      "Reviews pull requests like a senior engineer — catching logic errors, suggesting cleaner patterns, and explaining the reasoning behind every comment.",
    problem: "Code reviews are slow, inconsistent, and often skipped under deadline pressure.",
    audience: "Small engineering teams without dedicated senior reviewers.",
    tags: ["AI Tool", "Dev Tool"],
    difficulty: "Hard",
  },
];

// Pulsing dots — shown during the "thinking" phase
function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[7px] w-[7px] rounded-full bg-brand"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1, 0.75] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-sm text-zinc-500">Analyzing your prompt…</span>
    </div>
  );
}

function IdeaSkeletons() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-6">
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-zinc-800/80" />
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          {label}
        </span>
      </div>
      <div className="h-px flex-1 bg-zinc-800/80" />
    </div>
  );
}

export function PromptForm() {
  const [prompt, setPrompt] = useState("");
  const [productType, setProductType] = useState<ProductType | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleCount, setVisibleCount] = useState(0);

  const isGenerating = phase !== "idle";

  async function handleGenerate() {
    if (!prompt.trim()) return;

    // Phase 1 — thinking dots
    setPhase("thinking");
    setIdeas([]);
    setVisibleCount(0);
    await wait(800);

    // Phase 2 — skeleton cards (simulates API latency)
    setPhase("generating");
    await wait(1400);

    // Phase 3 — stream cards one by one
    const results = MOCK_IDEAS;
    setIdeas(results);
    setPhase("streaming");

    for (let i = 0; i < results.length; i++) {
      if (i > 0) await wait(420);
      setVisibleCount(i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Textarea */}
      <Textarea
        rows={5}
        placeholder="I know React and Laravel and want to build something for developers..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[140px]"
      />

      {/* Filters + Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2.5">
          <div className="flex-1">
            <Select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
            >
              <option value="">Product type</option>
              <option value="SaaS">SaaS</option>
              <option value="AI Tool">AI Tool</option>
              <option value="Chrome Extension">Chrome Extension</option>
              <option value="Dev Tool">Dev Tool</option>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="">Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Ideas →"
          )}
        </Button>
      </div>

      {/* Results — phase-driven */}
      <AnimatePresence mode="wait">

        {/* idle — empty state */}
        {phase === "idle" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-10 flex flex-col items-center gap-5 rounded-xl border border-dashed border-zinc-800 px-8 py-20 text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-900 shadow-[0_0_20px_rgba(255,71,20,0.06)]">
              <Sparkles className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-400">
                Your ideas will appear here
              </p>
              <p className="text-xs leading-relaxed text-zinc-600">
                Describe your skills or a problem above,
                <br />
                then click Generate.
              </p>
            </div>
          </motion.div>
        )}

        {/* thinking — pulsing dots */}
        {phase === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <ThinkingIndicator />
          </motion.div>
        )}

        {/* generating — skeleton cards */}
        {phase === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <SectionLabel label="Generating ideas" />
            <IdeaSkeletons />
          </motion.div>
        )}

        {/* streaming — real cards appear one by one */}
        {phase === "streaming" && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <SectionLabel
              label="Generated by IdeaPick AI"
              icon={<Sparkles className="h-3 w-3 text-brand/70" />}
            />
            <div className="grid gap-3">
              <AnimatePresence>
                {ideas.slice(0, visibleCount).map((idea) => (
                  <motion.div
                    key={idea.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    <IdeaCard {...idea} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
