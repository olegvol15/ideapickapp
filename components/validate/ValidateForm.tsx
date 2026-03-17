'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ThinkingIndicator } from '@/components/research/ThinkingIndicator';
import { ValidationReport } from './ValidationReport';
import { validateIdeaStream } from '@/services/validate.service';
import { useValidateStore } from '@/stores/validate.store';
import { useSaveValidation } from '@/hooks/use-validations';
import { useAuth } from '@/context/auth';
import { PRODUCT_TYPE_OPTIONS } from '@/constants/products';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

type Phase = 'idle' | 'thinking' | 'researching' | 'analyzing' | 'done' | 'error';

const ANALYZING_LABELS = [
  'Scoring pain evidence…',
  'Assessing competition…',
  'Identifying opportunities…',
  'Almost there…',
];

function useAnalyzingLabel(active: boolean) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx((i) => (i + 1) % ANALYZING_LABELS.length), 3000);
    return () => clearInterval(id);
  }, [active]);
  return ANALYZING_LABELS[idx];
}

export function ValidateForm() {
  const { user } = useAuth();
  const saveValidation = useSaveValidation(user?.id);
  const pushLocalValidation = useValidateStore((s) => s.pushLocalValidation);

  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [audience, setAudience] = useState('');
  const [problem, setProblem] = useState('');

  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [competitorCount, setCompetitorCount] = useState(0);
  const [result, setResult] = useState<EnhancedValidationResult | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const analyzingLabel = useAnalyzingLabel(phase === 'analyzing');

  const researchingLabel =
    competitorCount > 0
      ? `Found ${competitorCount} signals, analyzing…`
      : 'Searching for market evidence…';

  const isActive = phase === 'thinking' || phase === 'researching' || phase === 'analyzing';
  const canSubmit = description.trim().length > 0 && productType.length > 0 && !isActive;

  async function handleSubmit() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResult(null);
    setCompetitors([]);
    setCompetitorCount(0);
    setErrorMsg('');
    setPhase('thinking');

    await new Promise((r) => setTimeout(r, 800));
    if (controller.signal.aborted) return;

    setPhase('researching');

    try {
      const data = await validateIdeaStream(
        {
          description,
          productType,
          audience: audience.trim() || undefined,
          problem: problem.trim() || undefined,
        },
        {
          signal: controller.signal,
          onResearch: (found) => {
            setCompetitorCount(found.length);
            setCompetitors(found);
            setPhase('analyzing');
          },
        }
      );

      setResult(data.result);
      setCompetitors(data.competitors);
      setPhase('done');

      // Persist result
      if (user) {
        saveValidation.mutate({
          description,
          productType,
          result: data.result,
          competitors: data.competitors,
        });
      } else {
        pushLocalValidation({
          id: String(Date.now()),
          description,
          productType,
          result: data.result,
          competitors: data.competitors,
          createdAt: Date.now(),
        });
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      const message =
        (err as { message?: string }).message ?? 'Something went wrong. Please try again.';
      setErrorMsg(message);
      setPhase('error');
    }
  }

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Description */}
      <Textarea
        rows={4}
        placeholder="A tool that helps freelancers automatically track billable hours from their calendar and generate invoices…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[120px]"
        maxLength={600}
      />

      {/* Product type + optional fields */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Select
            value={productType || undefined}
            onValueChange={setProductType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Product type (required)" />
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
          <Input
            placeholder="Who is this for? (optional)"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <Input
        placeholder="What pain does it solve? (optional)"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        maxLength={300}
      />

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {isActive ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating…
          </>
        ) : (
          'Validate Idea →'
        )}
      </Button>

      {/* Phase rendering */}
      <AnimatePresence mode="wait">
        {(phase === 'thinking' || phase === 'researching' || phase === 'analyzing') && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <ThinkingIndicator
              label={
                phase === 'thinking'
                  ? 'Preparing research queries…'
                  : phase === 'researching'
                  ? researchingLabel
                  : analyzingLabel
              }
            />
          </motion.div>
        )}

        {phase === 'done' && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <ValidationReport result={result} competitors={competitors} />
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
              <p className="text-sm font-semibold text-foreground">Validation failed</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{errorMsg}</p>
            </div>
            <button
              onClick={handleSubmit}
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
