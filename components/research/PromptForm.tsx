'use client';

import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ResultsTabs } from '@/components/ResultsTabs';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ResearchSkeletons } from './ResearchSkeletons';
import { useResearch } from '@/hooks/use-research';
import { PRODUCT_TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/constants/products';

export function PromptForm() {
  const {
    prompt,
    setPrompt,
    productType,
    setProductType,
    difficulty,
    setDifficulty,
    result,
    phase,
    visibleCount,
    errorMsg,
    isGenerating,
    handleGenerate,
  } = useResearch();

  return (
    <div className="flex flex-col gap-5">
      {/* Prompt input */}
      <Textarea
        rows={5}
        placeholder="I know React and Laravel and want to build something for developers..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[140px]"
      />

      {/* Filters + submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2.5">
          <div className="flex-1">
            <Select
              value={productType || undefined}
              onValueChange={(v) => setProductType(v as typeof productType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Product type" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={difficulty || undefined}
              onValueChange={(v) => setDifficulty(v as typeof difficulty)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
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
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Researching...
            </>
          ) : (
            'Find Opportunities →'
          )}
        </Button>
      </div>

      {/* Phase-based result area */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-10 flex flex-col items-center gap-5 rounded-xl border border-dashed px-8 py-20 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--accent-lo)',
                color: 'var(--accent)',
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--text-1)' }}
              >
                Your research will appear here
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-3)' }}
              >
                Describe your skills or a problem above,
                <br />
                then click Find Opportunities.
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'thinking' && (
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

        {phase === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <ResearchSkeletons />
          </motion.div>
        )}

        {(phase === 'streaming' || phase === 'done') && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            <ResultsTabs result={result} visibleCount={visibleCount} />
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-50/60 px-8 py-12 text-center dark:bg-red-500/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--text-1)' }}
              >
                Research failed
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-3)' }}
              >
                {errorMsg}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="mt-1 text-xs font-bold uppercase tracking-widest transition-all"
              style={{ color: 'var(--accent)' }}
            >
              Try again →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
