'use client';

import { useState } from 'react';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { EnhancedValidationResult } from '@/lib/schemas';

interface RefinePanelProps {
  description: string;
  result: EnhancedValidationResult;
  version: number;
  isLoading: boolean;
  onRevalidate: (newDescription: string) => void;
}

interface Suggestion {
  label: string;
  field: 'product' | 'audience' | 'coreValue';
  value: string;
  reason: string;
  insight?: string;
}

function buildSuggestions(result: EnhancedValidationResult): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 1. From whereToWin — most specific, grounded in the actual analysis
  const win = result.whereToWin?.[0];
  if (win) {
    const isAudience = /segment|niche|audience|trust|pricing/i.test(win.title);
    suggestions.push({
      label: win.opportunity,
      field: isAudience ? 'audience' : 'coreValue',
      value: win.opportunity,
      reason: isAudience ? 'narrows your audience' : 'sharpens your value proposition',
      insight: `Competitors ${win.gap.toLowerCase()}`,
    });
  }

  // 2. From decision — strategic angle
  const decisionMap: Record<string, Suggestion> = {
    drop: {
      label: 'Target a specific underserved niche',
      field: 'audience',
      value: 'a specific underserved niche',
      reason: 'reduces competition surface',
      insight: result.failureReasons?.[0] ?? result.risks?.[0],
    },
    'test-first': {
      label: 'Add a clear differentiator',
      field: 'coreValue',
      value: 'with a clear advantage competitors lack',
      reason: 'makes the idea more testable',
      insight: result.failureReasons?.[0] ?? result.risks?.[0],
    },
    proceed: {
      label: 'Specify your first target segment',
      field: 'audience',
      value: 'early adopters experiencing this problem acutely',
      reason: 'sharpens your launch strategy',
      insight: result.marketHardness,
    },
  };
  const dSug = decisionMap[result.decision ?? 'test-first'];
  if (dSug && suggestions.length < 3) suggestions.push(dSug);

  // 3. From competitorInsights — fill a named competitor gap
  const ci = result.competitorInsights?.[0];
  if (ci?.weakness && suggestions.length < 3) {
    suggestions.push({
      label: `Without: ${ci.weakness}`,
      field: 'coreValue',
      value: `without ${ci.weakness.toLowerCase()}`,
      reason: `fills gap left by ${ci.name}`,
      insight: `${ci.name} weakness: ${ci.weakness}`,
    });
  }

  return suggestions.slice(0, 3);
}

function reconstruct(product: string, audience: string, coreValue: string): string {
  const p = product.trim();
  const a = audience.trim();
  const c = coreValue.trim();
  if (!a && !c) return p;
  if (a && !c) return `${p} for ${a}`;
  if (!a && c) return `${p} — ${c}`;
  return `${p} for ${a} — ${c}`;
}

const FIELD_LABEL: Record<Suggestion['field'], string> = {
  product: 'product',
  audience: 'audience',
  coreValue: 'core value',
};

export function RefinePanel({ description, result, version, isLoading, onRevalidate }: RefinePanelProps) {
  const [product, setProduct] = useState(description);
  const [audience, setAudience] = useState('');
  const [coreValue, setCoreValue] = useState('');

  const suggestions = buildSuggestions(result);

  const hasChanges = product.trim() !== description.trim() || !!audience.trim() || !!coreValue.trim();
  const afterText = reconstruct(product, audience, coreValue);

  function isApplied(s: Suggestion): boolean {
    if (s.field === 'product') return product.trim() === s.value.trim();
    if (s.field === 'audience') return audience.trim() === s.value.trim();
    return coreValue.trim() === s.value.trim();
  }

  function applyField(field: Suggestion['field'], value: string) {
    if (field === 'product') setProduct(value);
    if (field === 'audience') setAudience(value);
    if (field === 'coreValue') setCoreValue(value);
  }

  function unapplyField(field: Suggestion['field']) {
    if (field === 'product') setProduct(description);
    if (field === 'audience') setAudience('');
    if (field === 'coreValue') setCoreValue('');
  }

  function reset() {
    setProduct(description);
    setAudience('');
    setCoreValue('');
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card px-6 py-5 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
          Refine Idea
        </p>
        {version > 1 && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground/75">
            Version {version}
          </span>
        )}
      </div>

      {/* Structured fields */}
      <div className="flex flex-col gap-3">
        {[
          { label: 'Product', value: product, set: setProduct, placeholder: 'What are you building?' },
          { label: 'Audience', value: audience, set: setAudience, placeholder: 'Who is it for?' },
          { label: 'Core value', value: coreValue, set: setCoreValue, placeholder: 'What makes it different?' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="grid grid-cols-[90px_1fr] items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/65 text-right pr-1">
              {label}
            </span>
            <Input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="h-9 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/65">
            Angles based on your results
          </p>
          {suggestions.map((s, i) => {
            const applied = isApplied(s);
            return (
              <div
                key={i}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-colors',
                  applied
                    ? 'border-emerald-500/25 bg-emerald-500/[0.05]'
                    : 'border-border bg-muted/20'
                )}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground/90 leading-snug">{s.label}</p>
                  <p className="text-xs text-muted-foreground/70 leading-snug">
                    <span className="text-emerald-500/80">→ </span>{s.reason}
                    {s.field !== 'product' && (
                      <span className="text-muted-foreground/55"> · updates {FIELD_LABEL[s.field]}</span>
                    )}
                  </p>
                  {s.insight && (
                    <p className="text-[11px] text-muted-foreground/60 leading-snug mt-0.5 italic">
                      {s.insight}
                    </p>
                  )}
                </div>
                {applied ? (
                  <button
                    type="button"
                    onClick={() => unapplyField(s.field)}
                    className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors mt-0.5"
                    title="Undo"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => applyField(s.field, s.value)}
                    className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground/70 hover:text-foreground transition-colors pt-0.5"
                  >
                    Apply
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Before / After */}
      {hasChanges && (
        <div className="rounded-lg border border-border overflow-hidden text-sm">
          <div className="grid grid-cols-[52px_1fr] items-start gap-3 px-4 py-2.5 border-b border-border">
            <span className="text-muted-foreground/60 font-semibold uppercase tracking-wide text-[10px] pt-px">Before</span>
            <span className="text-foreground/65 leading-snug line-clamp-1">{description}</span>
          </div>
          <div className="grid grid-cols-[52px_1fr] items-start gap-3 px-4 py-2.5 bg-emerald-500/[0.04]">
            <span className="text-emerald-500/80 font-semibold uppercase tracking-wide text-[10px] pt-px">After</span>
            <span className="text-foreground/80 font-medium leading-snug">{afterText}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {hasChanges ? (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        ) : (
          <span />
        )}
        <Button
          className={cn('justify-between gap-2', !hasChanges && 'opacity-50')}
          disabled={isLoading || !product.trim()}
          onClick={() => onRevalidate(afterText)}
        >
          {isLoading ? 'Validating…' : 'Update & Re-validate'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}
