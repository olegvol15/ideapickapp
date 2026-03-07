"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { IdeaCard } from "@/components/idea-card";
import { MarketAnalysis } from "@/components/market-analysis";
import { CompetitorsList } from "@/components/competitors-list";
import { GapCard } from "@/components/gap-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerateResponse, ProductType, Difficulty } from "@/types";

type Phase = "idle" | "thinking" | "generating" | "streaming" | "done" | "error";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Sub-components ───────────────────────────────────────────────────────────

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[7px] w-[7px] rounded-full bg-brand"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1, 0.75] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}

function ResearchSkeletons() {
  return (
    <div className="space-y-3">
      {/* Market context skeleton */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-2/5 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
      {/* Competitors skeleton */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-5 py-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-zinc-800/50 last:border-0">
            <Skeleton className="h-4 w-14 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Gap skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-5">
          <Skeleton className="h-3 w-1/3 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-4">
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

// ─── Main component ───────────────────────────────────────────────────────────

export function PromptForm() {
  const [prompt, setPrompt] = useState("");
  const [productType, setProductType] = useState<ProductType | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleCount, setVisibleCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const isGenerating = phase === "thinking" || phase === "generating" || phase === "streaming";

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setPhase("thinking");
    setResult(null);
    setVisibleCount(0);
    setErrorMsg("");
    await wait(800);

    setPhase("generating");

    let data: GenerateResponse;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, productType, difficulty }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }

      data = await res.json();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
      return;
    }

    setResult(data);
    setPhase("streaming");

    for (let i = 0; i < data.ideas.length; i++) {
      if (i > 0) await wait(400);
      setVisibleCount(i + 1);
    }

    setPhase("done");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Input */}
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
            <Select value={productType || undefined} onValueChange={(v) => setProductType(v as ProductType)}>
              <SelectTrigger><SelectValue placeholder="Product type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SaaS">SaaS</SelectItem>
                <SelectItem value="AI Tool">AI Tool</SelectItem>
                <SelectItem value="Chrome Extension">Chrome Extension</SelectItem>
                <SelectItem value="Dev Tool">Dev Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={difficulty || undefined} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Researching...</>
          ) : (
            "Find Opportunities →"
          )}
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">

        {/* idle */}
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
              <p className="text-sm font-semibold text-zinc-400">Your research will appear here</p>
              <p className="text-xs leading-relaxed text-zinc-600">
                Describe your skills or a problem above,
                <br />
                then click Find Opportunities.
              </p>
            </div>
          </motion.div>
        )}

        {/* thinking */}
        {phase === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <ThinkingIndicator label="Analyzing your prompt…" />
          </motion.div>
        )}

        {/* generating — skeleton while API runs */}
        {phase === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <SectionLabel label="Searching market & analyzing competitors" />
            <ResearchSkeletons />
          </motion.div>
        )}

        {/* results */}
        {(phase === "streaming" || phase === "done") && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-8 space-y-8"
          >
            {/* 1. Market Analysis */}
            <div>
              <SectionLabel
                label="Market Analysis"
                icon={<Sparkles className="h-3 w-3 text-brand/70" />}
              />
              <MarketAnalysis marketContext={result.marketContext} />
            </div>

            {/* 2. Competitor Landscape */}
            <div>
              <SectionLabel label="Competitor Landscape" />
              <CompetitorsList competitors={result.competitors} />
            </div>

            {/* 3. Identified Gaps */}
            <div>
              <SectionLabel label="Identified Gaps" />
              <div className="grid gap-3">
                {result.gaps.map((gap, i) => (
                  <GapCard key={i} gap={gap} />
                ))}
              </div>
            </div>

            {/* 4. Opportunities — streamed */}
            <div>
              <SectionLabel
                label="Opportunities"
                icon={<Sparkles className="h-3 w-3 text-brand/70" />}
              />
              <div className="grid gap-3">
                <AnimatePresence>
                  {result.ideas.slice(0, visibleCount).map((idea) => (
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
            </div>
          </motion.div>
        )}

        {/* error */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-brand/20 bg-brand/5 px-8 py-12 text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/30 bg-brand/10">
              <AlertTriangle className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-zinc-300">Research failed</p>
              <p className="text-xs leading-relaxed text-zinc-500">{errorMsg}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="mt-1 text-xs font-bold uppercase tracking-widest text-brand hover:brightness-125 transition-all"
            >
              Try again →
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
