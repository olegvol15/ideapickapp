'use client';

import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
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

  function applyField(field: Suggestion['field'], value: string) {
    if (field === 'product') setProduct(value);
    if (field === 'audience') setAudience(value);
    if (field === 'coreValue') setCoreValue(value);
  }

  function reset() {
    setProduct(description);
    setAudience('');
    setCoreValue('');
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-card px-5 py-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Refine Idea
        </p>
        {version > 1 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/60">
            Version {version}
          </span>
        )}
      </div>

      {/* Structured fields */}
      <div className="flex flex-col gap-2">
        {[
          { label: 'Product', value: product, set: setProduct, placeholder: 'What are you building?' },
          { label: 'Audience', value: audience, set: setAudience, placeholder: 'Who is it for?' },
          { label: 'Core value', value: coreValue, set: setCoreValue, placeholder: 'What makes it different?' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="grid grid-cols-[80px_1fr] items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/40 text-right pr-1">
              {label}
            </span>
            <Input
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/35">
            Angles based on your results
          </p>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-xs font-medium text-foreground/80 leading-snug">{s.label}</p>
                <p className="text-[11px] text-muted-foreground/50 leading-snug">
                  <span className="text-emerald-500/60">→ </span>{s.reason}
                  {s.field !== 'product' && (
                    <span className="text-muted-foreground/35"> · updates {FIELD_LABEL[s.field]}</span>
                  )}
                </p>
                {s.insight && (
                  <p className="text-[10px] text-muted-foreground/35 leading-snug mt-0.5 italic">
                    {s.insight}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => applyField(s.field, s.value)}
                className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/50 hover:text-foreground transition-colors pt-0.5"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Before / After */}
      {hasChanges && (
        <div className="rounded-lg border border-border overflow-hidden text-[11px]">
          <div className="grid grid-cols-[48px_1fr] items-start gap-2 px-3 py-2 border-b border-border">
            <span className="text-muted-foreground/35 font-semibold uppercase tracking-wide text-[9px] pt-px">Before</span>
            <span className="text-foreground/45 leading-snug line-clamp-1">{description}</span>
          </div>
          <div className="grid grid-cols-[48px_1fr] items-start gap-2 px-3 py-2 bg-emerald-500/[0.04]">
            <span className="text-emerald-500/60 font-semibold uppercase tracking-wide text-[9px] pt-px">After</span>
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
            className="flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            Reset
          </button>
        ) : (
          <span />
        )}
        <Button
          size="sm"
          className={cn('justify-between gap-2', !hasChanges && 'opacity-50')}
          disabled={isLoading || !product.trim()}
          onClick={() => onRevalidate(afterText)}
        >
          {isLoading ? 'Validating…' : 'Update & Re-validate'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

    </div>
  );
}
