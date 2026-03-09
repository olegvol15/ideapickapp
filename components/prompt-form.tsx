"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ResultsTabs } from "@/components/results-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerateResponse, ProductType, Difficulty } from "@/types";

type Phase = "idle" | "thinking" | "generating" | "streaming" | "done" | "error";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1, 0.75] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="text-sm" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}

function ResearchSkeletons() {
  return (
    <div>
      <div className="flex mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {["Opportunities", "Market", "Competitors"].map((label, i) => (
          <div
            key={label}
            className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: i === 0 ? "var(--accent)" : "var(--text-4)",
              borderBottom: i === 0 ? "2px solid var(--accent)" : undefined,
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
            <Skeleton className="h-3 w-3/4 mb-3" />
            <div className="space-y-2 mb-4">
              <div className="flex gap-2"><Skeleton className="h-3 w-14 shrink-0" /><Skeleton className="h-3 flex-1" /></div>
              <div className="flex gap-2"><Skeleton className="h-3 w-14 shrink-0" /><Skeleton className="h-3 flex-1" /></div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      if (i > 0) await wait(380);
      setVisibleCount(i + 1);
    }
    setPhase("done");
  }

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        rows={5}
        placeholder="I know React and Laravel and want to build something for developers..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[140px]"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2.5">
          <div className="flex-1">
            <Select value={productType || undefined} onValueChange={(v) => setProductType(v as ProductType)}>
              <SelectTrigger><SelectValue placeholder="Product type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SaaS">SaaS</SelectItem>
                <SelectItem value="AI Tool">AI Tool</SelectItem>
                <SelectItem value="Mobile App">Mobile App</SelectItem>
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
        <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full sm:w-auto">
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Researching...</> : "Find Opportunities →"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-10 flex flex-col items-center gap-5 rounded-xl border border-dashed px-8 py-20 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: "var(--border)", backgroundColor: "var(--accent-lo)", color: "var(--accent)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Your research will appear here</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                Describe your skills or a problem above,<br />then click Find Opportunities.
              </p>
            </div>
          </motion.div>
        )}

        {phase === "thinking" && (
          <motion.div key="thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-10 flex justify-center">
            <ThinkingIndicator label="Analyzing your prompt…" />
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-8">
            <ResearchSkeletons />
          </motion.div>
        )}

        {(phase === "streaming" || phase === "done") && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="mt-8">
            <ResultsTabs result={result} visibleCount={visibleCount} />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
            className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-50/60 px-8 py-12 text-center dark:bg-red-500/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Research failed</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>{errorMsg}</p>
            </div>
            <button onClick={handleGenerate} className="mt-1 text-xs font-bold uppercase tracking-widest transition-all" style={{ color: "var(--accent)" }}>
              Try again →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
