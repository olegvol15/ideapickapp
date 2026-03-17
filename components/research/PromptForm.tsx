'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
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
import { useAuth } from '@/context/auth';
import { useResearch } from '@/hooks/use-research';
import { useResearchStore } from '@/stores/research.store';
import { PRODUCT_TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '@/constants/products';

export function PromptForm() {
  const { user } = useAuth();

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
    generationId,
    statusLabel,
  } = useResearchStore();

  const { handleGenerate, handleClear, isGenerating, errorMsg } = useResearch(
    user?.id
  );

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

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 sm:flex-none"
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
      </div>

      {/* Phase-based result area */}
      <AnimatePresence mode="wait">
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
            <ResearchSkeletons statusLabel={statusLabel} />
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
            <ResultsTabs
              result={result}
              visibleCount={visibleCount}
              generationId={generationId}
            />
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
              <p className="text-sm font-semibold text-foreground">
                Research failed
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="mt-1 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:opacity-75"
            >
              Try again →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
